// 受付 v173：サーバーの「今日まだ」に人からの反応を入れる（functions/beauty.js の nudge）。架空データ・にせの送信の仕組み
//   まだの人：今日できたバディの名前を入れる（いなければ今までの文）／今日できた人：今日の 👏 があれば「👏が○こ届いたよ」（無ければ送らない）
//   v175: 日曜は「今週のまとめ」が届くので、ここは月曜（2026-12-07）で試す
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
  const now = Date.UTC(2026, 11, 7, 11, 0); // 日本時間 2026-12-07 20:00
  const t0 = Date.UTC(2026, 11, 6, 15, 0);  // 日本時間 2026-12-07 0:00
  const pl = (x) => Object.assign({ course: 'diet', qs: ['water'], start: '2026-12-01', days: { '2026-12-06': ['water'] }, atMs: 1 }, x);
  const store = {
    // u1：まだ・バディのさくら（今日できた）とゆり（昨日）
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },
    ['cards/' + T32('a') + '/plan/me']: pl({}),
    ['cards/' + T32('a') + '/buddy/me']: { k: 'b_1', list: [{ k: 'b_2', n: '見本 さくら' }, { k: 'b_3', n: '見本 ゆり' }] },
    'ckBuddy/b_2': { uid: 'u2', n: '見本 さくら', td: '2026-12-07' },
    'ckBuddy/b_3': { uid: 'u3', n: '見本 ゆり', td: '2026-12-06' },
    // u4：まだ・バディなし → 今までの文
    'ckPush/u4': { card: T32('d'), union: 'U1', t: 'tok4', on: true },
    ['cards/' + T32('d') + '/plan/me']: pl({}),
    // u5：今日できた・今日の 👏 2こ（昨日の 1こは数えない）
    'ckPush/u5': { card: T32('e'), union: 'U1', t: 'tok5', on: true },
    ['cards/' + T32('e') + '/plan/me']: pl({ days: { '2026-12-07': ['water'] } }),
    ['cards/' + T32('e') + '/lounge/p1']: { at: 1 },
    'ckLounge/p1/clap/x1': { at: t0 + 3600000 }, 'ckLounge/p1/clap/x2': { at: t0 + 7200000 }, 'ckLounge/p1/clap/x3': { at: t0 - 3600000 },
    // u6：今日できた・👏なし → 送らない
    'ckPush/u6': { card: T32('f'), union: 'U1', t: 'tok6', on: true },
    ['cards/' + T32('f') + '/plan/me']: pl({ days: { '2026-12-07': ['water'] } })
  };
  const m = fakeMsg();
  const r = await B.nudge(fakeDb(store), m, now, {});
  const by = (t) => m.sent.find((x) => x.token === t);
  c('まだの人：今日できたバディの名前（さくらさん）だけを入れる', by('tok1') && /バディのさくらさんは今日できたよ。あなたも1つやってみよう/.test(by('tok1').webpush.notification.body) && !/ゆり/.test(by('tok1').webpush.notification.body), JSON.stringify(by('tok1')));
  c('バディがいない人は今までの文・アイコンの印', by('tok4') && /今日のクエスト、まだだよ/.test(by('tok4').webpush.notification.body) && by('tok4').data.badge === '1');
  c('今日できた人：今日の 👏 の数（昨日の分は数えない）・印は付けない', by('tok5') && /今日もできたね！あなたの投稿に👏が2こ届いたよ/.test(by('tok5').webpush.notification.body) && !by('tok5').data.badge && /^nb-clap-/.test(by('tok5').data.tag), JSON.stringify(by('tok5')));
  c('今日できて 👏 が無い人には送らない', !by('tok6'));
  c('1人1通（送った数 3）・数の記録', m.sent.length === 3 && r.sent === 3 && r.buddy === 1 && r.clap === 1, JSON.stringify(r));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
