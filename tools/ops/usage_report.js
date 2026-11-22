// Firebase（hotlist）の使用状況のまとめ（オーナーが Cloud Shell で動かす）。数だけを出す（名前・メールアドレスは出さない）
//   使い方:  git -C groove-map pull && node groove-map/tools/ops/usage_report.js
//   読み取り: users を1回全部読む（人数分）＋ appAccess/mode・appConfig/unions の2件。Cloud Monitoring は Firestore の読み取りに数えない
//   出すもの:
//     ① NAVIGATOR を開いた人の数（users.lastSeenAt＝NAVIGATOR が5分に1回まで書く）: 今日・直近7日・1日ごと
//     ② Firestore 全体の読み取り・書き込み・削除の回数（Cloud Monitoring）: 直近8日の1日ごと（日本時間）。アプリ別には分かれない
//     ③ NAVIGATOR を使える（解放済みの）人数: 公開の範囲（appAccess/mode）と先行利用（users.early）から、アプリと同じ決め方で数える
//     ④ users に入っている「最後に〜」らしい項目の名前と人数（ほかのアプリが記録しているかの手がかり）
//     ⑤ 読み取りの内訳（v884〜: アプリが画面・場所ごとに数えた readStats）: 直近の日ごとに、アプリ別・画面別・場所別。
//        日付を指定する時は  node groove-map/tools/ops/usage_report.js 20261120 （readStats の読み取り＝その日に記録した人数分）
const { execSync } = require('child_process');
const P = process.env.PROJECT || 'hotlist-21865';
const OWNERS = ['j2DPDAccCygHmR9i5K3bTvHnH0V2', 'E4WT7EHai5c6WANUgASz42Euu1y1'];   // app.js の OWNER_UIDS と同じ
const tok = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
const H = { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', 'x-goog-user-project': P };
const FS = 'https://firestore.googleapis.com/v1/projects/' + P + '/databases/(default)/documents';
const DAY = 86400000, JST = 9 * 3600000;
const jstDay = (ms) => new Date(ms + JST).toISOString().slice(0, 10);
const now = Date.now(), today0 = Math.floor((now + JST) / DAY) * DAY - JST;   // 今日 0:00（日本時間）
const val = (v) => !v ? undefined : 'stringValue' in v ? v.stringValue : 'booleanValue' in v ? v.booleanValue : 'integerValue' in v ? +v.integerValue
  : 'arrayValue' in v ? (v.arrayValue.values || []).map(val) : 'mapValue' in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : undefined;
async function j(url, opt) { const r = await fetch(url, Object.assign({ headers: H }, opt || {})); const t = await r.text(); if (!r.ok) throw new Error(r.status + ' ' + url.split('?')[0] + ' ' + t.slice(0, 300)); return JSON.parse(t || '{}'); }
async function getDoc(path) { try { const d = await j(FS + '/' + path); return Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])); } catch (e) { if (/^404/.test(e.message)) return null; throw e; } }
async function allUsers() {
  const L = []; let pt = '';
  do { const d = await j(FS + '/users?pageSize=300' + (pt ? '&pageToken=' + encodeURIComponent(pt) : '')); (d.documents || []).forEach(x => L.push({ uid: x.name.split('/').pop(), f: Object.fromEntries(Object.entries(x.fields || {}).map(([k, v]) => [k, val(v)])) })); pt = d.nextPageToken || ''; } while (pt);
  return L;
}
async function metric(type) {
  const end = today0 + DAY, start = end - 8 * DAY;
  const q = new URLSearchParams({ filter: 'metric.type="firestore.googleapis.com/document/' + type + '"', 'interval.startTime': new Date(start).toISOString(), 'interval.endTime': new Date(end).toISOString(),
    'aggregation.alignmentPeriod': '86400s', 'aggregation.perSeriesAligner': 'ALIGN_SUM', 'aggregation.crossSeriesReducer': 'REDUCE_SUM' });
  const d = await j('https://monitoring.googleapis.com/v3/projects/' + P + '/timeSeries?' + q);
  const out = {};
  (d.timeSeries || []).forEach(ts => (ts.points || []).forEach(p => { const k = jstDay(Date.parse(p.interval.endTime) - 1); out[k] = (out[k] || 0) + (+p.value.int64Value || 0); }));
  return out;
}
(async () => {
  console.log('■ Firebase 使用状況（' + P + '） ' + new Date(now + JST).toISOString().slice(0, 16).replace('T', ' ') + ' 日本時間\n');
  const U = await allUsers();
  const A = (await getDoc('appAccess/mode')) || { mode: 'open' };
  const live = U.filter(u => u.f.deleted !== true);
  // ① NAVIGATOR を開いた人
  const seen = live.map(u => Date.parse(u.f.lastSeenAt || '') || 0);
  console.log('① NAVIGATOR を開いた人（最後に開いた日で数える。lastSeenAt）');
  console.log('   今日（' + jstDay(today0) + '）: ' + seen.filter(t => t >= today0).length + '人 ／ 直近7日: ' + seen.filter(t => t >= today0 - 6 * DAY).length + '人 ／ 登録している人: ' + live.length + '人');
  const byDay = {}; seen.forEach(t => { if (t >= today0 - 6 * DAY) { const k = jstDay(t); byDay[k] = (byDay[k] || 0) + 1; } });
  console.log('   最後に開いた日ごと: ' + Object.keys(byDay).sort().map(k => k.slice(5) + ' ' + byDay[k] + '人').join(' ／ '));
  console.log('   ※ 毎日開いた人も「最後の日」1回だけに数えます（日ごとの延べ人数ではありません）\n');
  // ② 読み取り回数
  const R = await metric('read_count'), W = await metric('write_count'), D = await metric('delete_count');
  console.log('② Firestore 全体の回数（1日ごと・日本時間。無料枠: 読み取り 5万・書き込み 2万・削除 2万）');
  Object.keys(R).sort().forEach(k => console.log('   ' + k + '  読み取り ' + String(R[k] || 0).padStart(7) + '  書き込み ' + String(W[k] || 0).padStart(6) + '  削除 ' + String(D[k] || 0).padStart(5) + (R[k] > 50000 ? '  ← 読み取りが無料枠を超えた' : '')));
  console.log('   ※ アプリ別・画面別には分かれません（同じデータベースを全部のアプリで使っているため）\n');
  // ③ 解放済み
  const ok = (u) => OWNERS.includes(u.uid) || u.f.role === 'admin' || !A.mode || A.mode === 'open' || u.f.early === true || (A.mode === 'union' && (A.unions || []).includes(u.f.union));
  const act = live.filter(u => u.f.status !== 'pending' && u.f.status !== 'disabled');
  console.log('③ NAVIGATOR を使える人（公開の範囲: ' + (A.mode || 'open') + (A.mode === 'union' ? '・' + (A.unions || []).join('/') : '') + '）');
  console.log('   使える人: ' + act.filter(ok).length + '人（うち先行利用 ' + act.filter(u => u.f.early === true).length + '人・管理者とオーナー ' + act.filter(u => OWNERS.includes(u.uid) || u.f.role === 'admin').length + '人）');
  console.log('   承認ずみで、まだ使えない人: ' + act.filter(u => !ok(u)).length + '人 ／ 承認待ち: ' + live.filter(u => u.f.status === 'pending').length + '人 ／ 無効: ' + live.filter(u => u.f.status === 'disabled').length + '人');
  const ea = act.filter(u => u.f.early === true).map(u => Date.parse(u.f.earlyAt || u.f.approvedAt || '') || 0).filter(Boolean);
  if (ea.length) console.log('   先行利用にした日（分かる人だけ）: ' + Object.entries(ea.reduce((m, t) => (m[jstDay(t)] = (m[jstDay(t)] || 0) + 1, m), {})).sort().slice(-7).map(([k, n]) => k.slice(5) + ' ' + n + '人').join(' ／ '));
  const tdy = act.filter(u => (Date.parse(u.f.lastSeenAt || '') || 0) >= today0);
  console.log('   今日開いた人のうち、使える人: ' + tdy.filter(ok).length + '人\n');
  // ④ ほかのアプリの記録の手がかり
  const keys = {}; live.forEach(u => Object.keys(u.f).forEach(k => { if (/last|seen|login|At$/i.test(k)) keys[k] = (keys[k] || 0) + 1; }));
  console.log('④ users の「〜した時」の項目（項目名: 入っている人数。ほかのアプリが記録していれば、アプリ別の人数に使える）');
  console.log('   ' + Object.entries(keys).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ': ' + n).join(' ／ '));
  // 1人あたり
  const r1 = R[jstDay(today0)] || 0, n1 = seen.filter(t => t >= today0).length;
  if (n1) console.log('\n■ 今日の1人あたりの読み取り（全体の読み取り ÷ NAVIGATOR を開いた人）: 約 ' + Math.round(r1 / n1) + ' 回（ほかのアプリの分も含む）');
  // ⑤ 読み取りの内訳（readStats）
  const days = process.argv[2] ? [process.argv[2]] : [jstDay(today0 - DAY), jstDay(today0)].map(k => k.replace(/-/g, ''));
  for (const d of days) {
    const L = []; let pt = '';
    try {
      do { const x = await j(FS + '/readStats/' + d + '/u?pageSize=300' + (pt ? '&pageToken=' + encodeURIComponent(pt) : '')); (x.documents || []).forEach(z => L.push(Object.fromEntries(Object.entries(z.fields || {}).map(([k, v]) => [k, val(v)])))); pt = x.nextPageToken || ''; } while (pt);
    } catch (e) { console.log('\n⑤ ' + d + ': 読めませんでした（' + e.message.slice(0, 80) + '）'); continue; }
    const dk = d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6);
    console.log('\n⑤ 読み取りの内訳 ' + dk + '（アプリが数えた分。記録した人・端末: ' + L.length + '）' + (L.length ? '' : '  ← まだ記録がありません（v884 を開いた人から記録されます）'));
    if (!L.length) continue;
    const sum = (arr) => arr.reduce((a, x) => a + (x.n || 0), 0), all = sum(L);
    ['nav', 'ck'].forEach(app => {
      const A = L.filter(x => x.app === app), n = sum(A), people = A.filter(x => x.uid).length, anonN = A.length - people;
      console.log('   ' + (app === 'nav' ? 'NAVIGATOR' : '受付・会員証') + ': ' + n + ' 回（ログインした人 ' + people + '人' + (anonN ? '・ログインなしの端末 ' + anonN : '') + (A.length ? '・1人（1端末）あたり 約' + Math.round(n / A.length) + ' 回' : '') + '）');
    });
    if (R[dk]) console.log('   Firestore 全体 ' + R[dk] + ' 回のうち、アプリが数えた分は 約' + Math.round(all / R[dk] * 100) + '%（残りは ATTACK LIST・GOAL SETTING・サーバーの処理・v884 より前の版の端末など）');
    const tags = {}, keys = {};
    L.forEach(x => Object.entries(x.by || {}).forEach(([k, v]) => { const t = (x.app === 'nav' ? 'NAV ' : '受付 ') + k.split('|')[0], p = (x.app === 'nav' ? 'NAV ' : '受付 ') + k; tags[t] = (tags[t] || 0) + (+v || 0); keys[p] = (keys[p] || 0) + (+v || 0); }));
    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
    console.log('   画面ごと（多い順）: ' + top(tags, 12).map(([k, v]) => k + ' ' + v).join(' ／ '));
    console.log('   画面｜読んだ場所（多い順・上位20）:');
    top(keys, 20).forEach(([k, v]) => console.log('     ' + String(v).padStart(7) + '  ' + k));
    const heavy = L.slice().sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, 5);
    console.log('   いちばん多い人・端末の回数（名前は出さない）: ' + heavy.map(x => (x.app === 'nav' ? 'NAV ' : '受付 ') + (x.n || 0)).join(' ／ '));
  }
})().catch(e => { console.error('エラー:', e.message); console.error('Cloud Shell で gcloud config set project ' + P + ' をしてから、もう一度動かしてください'); process.exit(1); });
