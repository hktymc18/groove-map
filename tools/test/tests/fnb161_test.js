// 受付 v161：サーバーのプログラム（functions/beauty.js）の「今日まだ」。マイプランを始めていて、今日まだチェックしていない人だけに送る。
//   お礼・前日のお知らせを送った人には送らない（1晩に1通まで）・14日より前にやめた人には送らない。にせのデータベースと送信の仕組み（架空データ）
const path = require('path');
const B = require(path.join(__dirname, '../../../functions/beauty.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const T32 = (ch) => ch.repeat(32);
function fakeDb(store) {
  const snap = (p) => ({ id: p.split('/').pop(), exists: store[p] !== undefined, data: () => store[p] && JSON.parse(JSON.stringify(store[p])), ref: ref(p) });
  const ref = (p) => ({ path: p, id: p.split('/').pop(), get: async () => snap(p), set: async (d, o) => { store[p] = o && o.merge ? Object.assign({}, store[p] || {}, d) : d; },
    collection: (n) => col(p + '/' + n) });
  const col = (p, fs) => ({
    doc: (id) => ref(p + '/' + id),
    where: (f, op, v) => col(p, (fs || []).concat([[f, v]])),
    get: async () => ({ docs: Object.keys(store).filter((k) => k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0)
      .filter((k) => (fs || []).every(([f, v]) => store[k][f] === v)).map(snap) })
  });
  return { collection: (n) => col(n) };
}
function fakeMsg(bad) {
  const sent = [];
  return { sent, sendEach: async (msgs) => { msgs.forEach((m) => sent.push(m)); return { responses: msgs.map((m) => bad && m.token === bad ? { success: false, error: { code: 'messaging/registration-token-not-registered' } } : { success: true }) }; } };
}
(async () => {
  const now = Date.UTC(2026, 11, 6, 11, 0); // 日本時間 2026-12-06 20:00
  const pl = (x) => Object.assign({ course: 'diet', qs: ['water'], start: '2026-12-01', days: {}, atMs: 1 }, x);
  const store = {
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },   // 今日まだ → 送る
    'ckPush/u2': { card: T32('b'), union: 'U1', t: 'tok2', on: true },   // 今日できた → 送らない
    'ckPush/u3': { card: T32('c'), union: 'U1', t: 'tok3', on: true },   // プランなし → 送らない
    'ckPush/u4': { card: T32('d'), union: 'U1', t: 'tok4', on: true },   // 20日前で止まっている → 送らない
    'ckPush/u5': { card: T32('e'), union: 'U1', t: 'tok5', on: false },  // 通知オフ
    'ckPush/u6': { card: T32('f'), union: 'U1', t: 'tok6', on: true },   // 今夜お礼を送った → 送らない
    'ckPush/u7': { card: T32('g'), union: 'U1', t: 'tok7', on: true },   // 始めたばかりでまだ0日 → 送る
    ['cards/' + T32('a') + '/plan/me']: pl({ days: { '2026-12-05': ['water'] } }),
    ['cards/' + T32('b') + '/plan/me']: pl({ days: { '2026-12-06': ['water'] } }),
    ['cards/' + T32('d') + '/plan/me']: pl({ start: '2026-11-01', days: { '2026-11-16': ['water'] } }),
    ['cards/' + T32('e') + '/plan/me']: pl({}),
    ['cards/' + T32('f') + '/plan/me']: pl({ days: { '2026-12-05': ['water'] } }),
    ['cards/' + T32('g') + '/plan/me']: pl({ start: '2026-12-06' })
  };
  const db = fakeDb(store), m = fakeMsg();
  const r = await B.nudge(db, m, now, { u6: 1 });
  const toks = m.sent.map((x) => x.token).sort().join(',');
  c('今日まだの人だけ（今日できた・プランなし・14日より前に止まった・通知オフ・今夜ほかの通知を送った人は除く）', toks === 'tok1,tok7' && r.sent === 2, toks + ' ' + JSON.stringify(r));
  const m1 = m.sent[0];
  c('文面・カードを開くリンク・アイコンの印', m1.webpush.notification.title === 'NAVIGATOR Beauty' && /今日のクエスト、まだだよ/.test(m1.webpush.notification.body)
    && m1.data.badge === '1' && m1.data.tag === 'nb-nudge-2026-12-06' && /#c=/.test(m1.webpush.fcmOptions.link), JSON.stringify(m1));
  // お礼・前日のお知らせを送った人は、sentIds に入る（index.js が nudge に渡す）
  const s2 = { 'checkinEvents/t1': { date: '2026-12-06', name: '12月のDAY', unions: ['U1'] }, 'checkinEvents/t1/attendance/u1': { kind: 'user' },
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true } };
  const sent = {};
  await B.thanks(fakeDb(s2), fakeMsg(), now, sent);
  c('お礼を送った人は sentIds に入る', sent.u1 === 1, JSON.stringify(sent));
  const s3 = { 'checkinEvents/e1': { date: '2026-12-07', name: '12月のDAY', unions: ['U1'], uDay: true }, 'ckPush/u2': { card: T32('b'), union: 'U1', t: 'tok2', on: true } };
  await B.dayEve(fakeDb(s3), fakeMsg(), now, sent);
  c('前日のお知らせを送った人も sentIds に入る', sent.u2 === 1, JSON.stringify(sent));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
