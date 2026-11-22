// 受付 v175：日曜の夜は、今日できた人に「今週のまとめ」を知らせる（functions/beauty.js の nudge）。架空データ・にせの送信の仕組み
//   👏 の通知がある人は 👏 だけ（1晩に1通まで）。今日まだの人は今まで通り
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
  const now = Date.UTC(2026, 11, 6, 11, 0); // 日本時間 2026-12-06（日）20:00
  const pl = (x) => Object.assign({ course: 'diet', qs: ['water'], start: '2026-11-01', days: {}, atMs: 1 }, x);
  const store = {
    // w1：今日できた・今週（11/30〜12/6）は 3日・先週の分は数えない
    'ckPush/w1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },
    ['cards/' + T32('a') + '/plan/me']: pl({ days: { '2026-12-06': ['water'], '2026-12-02': ['water'], '2026-11-30': ['water'], '2026-11-29': ['water'] } }),
    // w2：今日できた・👏あり → 👏の通知だけ（1晩に1通）
    'ckPush/w2': { card: T32('b'), union: 'U1', t: 'tok2', on: true },
    ['cards/' + T32('b') + '/plan/me']: pl({ days: { '2026-12-06': ['water'] } }),
    ['cards/' + T32('b') + '/lounge/p1']: { at: 1 },
    'ckLounge/p1/clap/x1': { at: now - 3600000 },
    // w3：今日まだ → 今まで通り「まだだよ」
    'ckPush/w3': { card: T32('c'), union: 'U1', t: 'tok3', on: true },
    ['cards/' + T32('c') + '/plan/me']: pl({ days: { '2026-12-05': ['water'] } })
  };
  const m = fakeMsg();
  const r = await B.nudge(fakeDb(store), m, now, {});
  const by = (t) => m.sent.filter((x) => x.token === t);
  c('日曜・今日できた人：今週できた日数（3日）と「今週のまとめ」', by('tok1').length === 1 && /今週は3日できたよ。アプリで「今週のまとめ」を見てみよう/.test(by('tok1')[0].webpush.notification.body) && /^nb-week-2026-12-06$/.test(by('tok1')[0].data.tag) && !by('tok1')[0].data.badge, JSON.stringify(by('tok1')));
  c('👏 がある人は 👏 の通知だけ（1晩に1通）', by('tok2').length === 1 && /👏が1こ届いたよ/.test(by('tok2')[0].webpush.notification.body));
  c('今日まだの人は今まで通り', by('tok3').length === 1 && /今日のクエスト、まだだよ/.test(by('tok3')[0].webpush.notification.body));
  c('数の記録（week 1）', r.week === 1 && r.clap === 1 && r.sent === 3, JSON.stringify(r));
  // 土曜は送らない
  const m2 = fakeMsg();
  const store2 = { 'ckPush/w1': store['ckPush/w1'], ['cards/' + T32('a') + '/plan/me']: pl({ days: { '2026-12-05': ['water'] } }) };
  const r2 = await B.nudge(fakeDb(store2), m2, Date.UTC(2026, 11, 5, 11, 0), {});
  c('日曜以外は、今日できて 👏 が無い人には送らない', m2.sent.length === 0 && r2.week === 0, JSON.stringify(r2));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
