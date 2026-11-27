/**
 * NAVIGATOR バグ報告の「見立て」（外の Claude が読む・書き戻す）
 *   queue … fbTriageQueue（GET）：状態が new（新着）・fix（改修する）の報告を返す。
 *           直すのに要らない個人情報（書いた人・依頼した人・uid・Slack のリンク・やりとりの名前）は返さない。スクショは枚数だけ。
 *   write … fbTriageWrite（POST・JSON）：2種類だけ。
 *           見立て { id, triage:{verdict, summary, plan, replyDraft, confidence} } → fbTriage/{id}（報告の状態は変えない）
 *           直した記録 { id, fix:{pr, step} } → fbItems/{id} の状態を fix→doing・doing→check の時だけ変え、fbTriage/{id} に PR を残す
 *   鍵：ヘッダー X-Triage-Key がシークレット TRIAGE_KEY と一致しない時は 401。
 * firebase-admin・firebase-functions はここでは読み込まない（テストで、にせの db を渡せるように）
 */
const crypto = require('crypto');

const MAX = 2000;                               // 各欄の文字数の上限
const QUEUE_ST = ['new', 'fix'];
const VERDICTS = ['bug', 'wa', 'no', 'decide'];
const CONF = ['high', 'mid', 'low'];
const TRIAGE_KEYS = ['verdict', 'summary', 'plan', 'replyDraft', 'confidence'];
const FIX_KEYS = ['pr', 'step'];
const STEP_FROM = { doing: 'fix', check: 'doing' }; // 許す状態の変化（行き先 ← 元）
const ST_LB = { fix: '改修する', doing: '対応中', check: '確認待ち' };
const PR_RE = /^https:\/\/github\.com\/hktymc18\/groove-map\/pull\/\d{1,7}$/;
const ID_RE = /^\d{1,9}$/;

// ── 鍵（長さが違っても時間で漏れないように、ハッシュどうしを比べる） ──
function keyOk(headers, secret) {
  const s = String(secret || '');
  if (!s) return false;                                      // シークレットが無い時は誰も通さない
  const h = headers || {};
  let got = h['x-triage-key'];
  if (got === undefined) Object.keys(h).forEach((k) => { if (k.toLowerCase() === 'x-triage-key') got = h[k]; });
  if (typeof got !== 'string' || !got) return false;
  const a = crypto.createHash('sha256').update(got).digest(), b = crypto.createHash('sha256').update(s).digest();
  return crypto.timingSafeEqual(a, b);
}

const iso = (v) => {
  if (!v) return '';
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
  const d = new Date(v); return isNaN(d.getTime()) ? '' : d.toISOString();
};
const str = (v) => (typeof v === 'string' ? v : (v === undefined || v === null ? '' : String(v)));

// ── 返す報告の形（決めた項目だけを選んで入れる＝個人情報は入らない） ──
function queueItem(id, x, notes) {
  x = x || {};
  return {
    id: String(id), no: x.no || Number(id) || 0, status: str(x.status), kind: str(x.kind || 'bug'), app: str(x.app || 'NAVIGATOR'),
    screen: str(x.screen), title: str(x.title), did: str(x.did), got: str(x.got), want: str(x.want), ver: str(x.ver), device: str(x.device),
    createdAt: iso(x.createdAt), due: str(x.due), dueK: str(x.dueK), adminComment: str(x.adminComment),
    notes: (notes || []).filter((n) => n && n.kind !== 'status')
      .map((n) => ({ text: str(n.text), admin: !!n.admin, at: iso(n.at) }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    imgN: x.imgsPurged ? 0 : (Number(x.imgN) || 0),
  };
}

// ── 書き込みの中身を確かめる（純粋な関数）。{ ok, kind, id, data } か { ok:false, err } ──
function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function validateWrite(body) {
  if (!isObj(body)) return { ok: false, err: 'body must be a JSON object' };
  const ks = Object.keys(body);
  const bad = ks.filter((k) => ['id', 'triage', 'fix'].indexOf(k) < 0);
  if (bad.length) return { ok: false, err: 'unknown field: ' + bad.join(',') };
  const id = typeof body.id === 'number' ? String(body.id) : body.id;
  if (typeof id !== 'string' || !ID_RE.test(id)) return { ok: false, err: 'bad id' };
  const hasT = body.triage !== undefined, hasF = body.fix !== undefined;
  if (hasT === hasF) return { ok: false, err: 'send exactly one of triage / fix' };
  if (hasT) {
    const t = body.triage;
    if (!isObj(t)) return { ok: false, err: 'triage must be an object' };
    const bt = Object.keys(t).filter((k) => TRIAGE_KEYS.indexOf(k) < 0);
    if (bt.length) return { ok: false, err: 'unknown triage field: ' + bt.join(',') };
    for (const k of TRIAGE_KEYS) {
      if (t[k] !== undefined && typeof t[k] !== 'string') return { ok: false, err: k + ' must be a string' };
      if ((t[k] || '').length > MAX) return { ok: false, err: k + ' is too long (max ' + MAX + ')' };
    }
    if (VERDICTS.indexOf(t.verdict) < 0) return { ok: false, err: 'verdict must be one of ' + VERDICTS.join('|') };
    if (CONF.indexOf(t.confidence) < 0) return { ok: false, err: 'confidence must be one of ' + CONF.join('|') };
    if (!(t.summary || '').trim()) return { ok: false, err: 'summary is required' };
    return { ok: true, kind: 'triage', id, data: { verdict: t.verdict, confidence: t.confidence, summary: t.summary.trim(), plan: (t.plan || '').trim(), replyDraft: (t.replyDraft || '').trim() } };
  }
  const f = body.fix;
  if (!isObj(f)) return { ok: false, err: 'fix must be an object' };
  const bf = Object.keys(f).filter((k) => FIX_KEYS.indexOf(k) < 0);
  if (bf.length) return { ok: false, err: 'unknown fix field: ' + bf.join(',') };
  if (typeof f.pr !== 'string' || f.pr.length > MAX || !PR_RE.test(f.pr)) return { ok: false, err: 'pr must be https://github.com/hktymc18/groove-map/pull/N' };
  if (!STEP_FROM[f.step]) return { ok: false, err: 'step must be doing|check' };
  return { ok: true, kind: 'fix', id, data: { pr: f.pr, step: f.step } };
}
// 状態の変化を許すか（fix→doing・doing→check だけ）
function stepOk(cur, step) { return !!STEP_FROM[step] && STEP_FROM[step] === cur; }

function parseBody(b) {
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return undefined; } }
  if (Buffer.isBuffer(b)) { try { return JSON.parse(b.toString('utf8')); } catch (e) { return undefined; } }
  return b;
}

// ── HTTP の中身（req は { method, headers, body }。返り値は { status, body }） ──
async function queue(db, req, secret) {
  if (!keyOk(req.headers, secret)) return { status: 401, body: { error: 'unauthorized' } };
  if (req.method !== 'GET') return { status: 405, body: { error: 'method not allowed (GET only)' } };
  const qs = await db.collection('fbItems').where('status', 'in', QUEUE_ST).get();
  const items = await Promise.all(qs.docs.map(async (d) => {
    const ns = await db.collection('fbItems').doc(d.id).collection('notes').get();
    return queueItem(d.id, d.data(), ns.docs.map((n) => n.data()));
  }));
  items.sort((a, b) => a.no - b.no);
  return { status: 200, body: { items, count: items.length } };
}

async function write(db, req, secret, now) {
  if (!keyOk(req.headers, secret)) return { status: 401, body: { error: 'unauthorized' } };
  if (req.method !== 'POST') return { status: 405, body: { error: 'method not allowed (POST only)' } };
  const v = validateWrite(parseBody(req.body));
  if (!v.ok) return { status: 400, body: { error: v.err } };
  const at = new Date(now || Date.now());
  const itemRef = db.collection('fbItems').doc(v.id), triRef = db.collection('fbTriage').doc(v.id);
  const it = await itemRef.get();
  if (!it.exists) return { status: 404, body: { error: 'no such item' } };
  if (v.kind === 'triage') {
    await triRef.set(Object.assign({}, v.data, { at, by: 'claude' }), { merge: true }); // PR の記録は残す
    return { status: 200, body: { ok: true, id: v.id, saved: 'triage' } };
  }
  const cur = (it.data() || {}).status;
  if (!stepOk(cur, v.data.step)) return { status: 409, body: { error: 'status change not allowed: ' + cur + ' -> ' + v.data.step + ' (only fix->doing, doing->check)' } };
  await itemRef.update({ status: v.data.step, statusAt: at, statusBy: 'Claude' });
  await itemRef.collection('notes').add({ kind: 'status', text: ST_LB[cur] + ' → ' + ST_LB[v.data.step] + '（Claude・' + v.data.pr + '）', byUid: 'claude', byName: 'Claude', at });
  await triRef.set({ pr: v.data.pr, prStep: v.data.step, prAt: at }, { merge: true });
  return { status: 200, body: { ok: true, id: v.id, status: v.data.step } };
}

module.exports = { MAX, keyOk, queueItem, validateWrite, stepOk, queue, write };
