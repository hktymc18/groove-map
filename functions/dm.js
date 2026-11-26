/**
 * NAVIGATOR Beauty：DAYスタッフへの相談（受付 v182）
 *   onMsg … 相談のメッセージが届いた時（index.js の beautyDmMsg から）
 *     お客さん → スタッフ：スタッフの NAVIGATOR の端末（users/{uid}/fcmTokens）に「相談が届きました」。
 *       紹介者の NAVIGATOR のために、会員証に cs = { at }（最後に相談した日だけ。会員証はリンクを知っていれば読めるので、分野も中身も入れない）
 *     スタッフ → お客さん：お客さんの端末（ckPush の card＝会員証）に「返事が届きました」。最初の返事の時刻（firstS）を相談に残す
 *     通知には相談の中身を入れない（ロック画面に出るため）
 *   stats … 毎日20時（beautyDaily から）：ユニオンごとの相談の数を ckDmStat/{ユニオン} にまとめる（中身は入れない・数だけ）
 * firebase-admin はここでは読み込まない（テストで、にせの db・messaging を渡せるように）
 */
const CARD = 'https://hktymc18.github.io/groove-map/checkin/index.html#c=';
const STAFF = 'https://hktymc18.github.io/groove-map/checkin/index.html';
const ICON = 'https://hktymc18.github.io/groove-map/checkin/icon-192.png';
const ms = (a) => (a && a.toMillis ? a.toMillis() : typeof a === 'number' ? a : (Date.parse(a) || 0));

async function staffTokens(db, uid) {
  const qs = await db.collection('users').doc(uid).collection('fcmTokens').get();
  const cut = new Date(Date.now() - 45 * 86400000).toISOString();
  return qs.docs.filter((d) => { const u = (d.data() || {}).updatedAt || ''; return !u || u >= cut; }).map((d) => ({ id: d.id, ref: d.ref }));
}
async function send(messaging, toks, title, body, tag, link) {
  if (!toks.length) return { ok: 0, ng: 0 };
  const res = await messaging.sendEach(toks.map((t) => ({
    token: t.id,
    data: { title, body, url: link, tag },
    webpush: { headers: { Urgency: 'high', TTL: '86400' }, notification: { title, body, icon: ICON, badge: ICON, tag }, fcmOptions: { link } },
  })));
  let ok = 0, ng = 0;
  res.responses.forEach((r, i) => {
    if (r.success) { ok++; return; }
    ng++;
    const code = String((r.error && (r.error.code || r.error)) || '');
    if (toks[i].off && (code.includes('registration-token-not-registered') || code.includes('invalid-argument'))) toks[i].off();
  });
  return { ok, ng };
}

async function onMsg(db, messaging, tid, m, now) {
  const tr = db.collection('ckDm').doc(tid), ts = await tr.get();
  if (!ts.exists || !m) return { skip: 'no thread' };
  const t = ts.data() || {}, out = { to: m.by === 'u' ? 'staff' : 'user', ok: 0, ng: 0 };
  if (m.by === 'u') {
    const toks = await staffTokens(db, t.sUid || '_');
    toks.forEach((k) => { k.off = () => k.ref.delete().catch(() => {}); });
    const r = await send(messaging, toks, 'NAVIGATOR Beauty の相談', (t.cname || 'お客さん') + ' さんから相談が届きました', 'nb-dm-' + tid, STAFF);
    out.ok = r.ok; out.ng = r.ng;
    if (t.tk) await db.collection('cards').doc(t.tk).set({ cs: { at: now } }, { merge: true }).catch(() => {});
  } else if (m.by === 's') {
    if (!t.firstS) await tr.set({ firstS: now }, { merge: true }).catch(() => {});
    if (t.stop) return Object.assign(out, { skip: 'stopped' });
    const qs = await db.collection('ckPush').where('card', '==', t.tk || '_').get();
    const toks = qs.docs.map((d) => ({ id: (d.data() || {}).t, ref: d.ref, on: (d.data() || {}).on === true }))
      .filter((k) => k.on && typeof k.id === 'string' && k.id);
    toks.forEach((k) => { k.off = () => k.ref.set({ on: false }, { merge: true }).catch(() => {}); });
    const r = await send(messaging, toks, 'NAVIGATOR Beauty', (t.sName || 'DAYスタッフ') + ' さんから、相談の返事が届きました', 'nb-dm-' + tid, CARD + t.tk);
    out.ok = r.ok; out.ng = r.ng;
  }
  return out;
}

// ユニオンごとの数（最近30日に始まった相談）。中身は入れない
async function stats(db, now) {
  const from = now - 30 * 86400000, by = {};
  const qs = await db.collection('ckDm').get();
  qs.docs.forEach((d) => {
    const t = d.data() || {}, at = ms(t.at), un = t.un;
    if (!un) return;
    const s = by[un] || (by[un] = { n30: 0, topics: {}, open: 0, done: 0, rep: 0, byStaff: 0, stop: 0, firstN: 0, firstSum: 0, noReply: 0 });
    if (t.st !== 'done') s.open++; else s.done++;
    if (t.rep && !t.repDone) s.rep++;
    if (at < from) return;
    s.n30++;
    s.topics[t.topic || 'other'] = (s.topics[t.topic || 'other'] || 0) + 1;
    if (t.byStaff) s.byStaff++;
    if (t.stop) s.stop++;
    if (!t.byStaff) { if (t.firstS && at) { s.firstN++; s.firstSum += Math.max(0, t.firstS - at); } else s.noReply++; }
  });
  const out = {};
  for (const un of Object.keys(by)) {
    const s = by[un];
    const doc = { n30: s.n30, topics: s.topics, open: s.open, done: s.done, rep: s.rep, byStaff: s.byStaff, stop: s.stop, noReply: s.noReply,
      avgFirstMin: s.firstN ? Math.round(s.firstSum / s.firstN / 60000) : null, at: now };
    await db.collection('ckDmStat').doc(un).set(doc);
    out[un] = s.n30;
  }
  return out;
}

module.exports = { onMsg, stats };
