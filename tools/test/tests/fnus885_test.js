// v885：サーバーのプログラム（functions/usage.js）。Cloud Monitoring の1日ごとの回数を、日本時間の日付で appStats/usage にまとめる
//   （にせの Monitoring・にせのデータベースで試す。本物には問い合わせない）
const path = require('path');
const U = require(path.join(__dirname, '../../../functions/usage.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
(async () => {
  const now = Date.parse('2026-11-19T03:00:00Z');   // 日本時間 11/19 12:00
  const url = new URL(U.queryUrl('hotlist-21865', 'read_count', now));
  c('日本時間の0時（前の日の15時 UTC）で区切って、直近8日を1日ごとに問い合わせる',
    url.searchParams.get('interval.endTime') === '2026-11-19T15:00:00.000Z' && url.searchParams.get('interval.startTime') === '2026-11-11T15:00:00.000Z'
    && url.searchParams.get('aggregation.alignmentPeriod') === '86400s' && /document\/read_count/.test(url.searchParams.get('filter')), url.toString());
  const pts = (arr) => ({ timeSeries: [{ points: arr.map(([end, v]) => ({ interval: { endTime: end }, value: { int64Value: String(v) } })) }] });
  const R = U.toDays(pts([['2026-11-19T15:00:00Z', 4708], ['2026-11-18T15:00:00Z', 207241]]));
  c('区切りの終わりの時刻から、日本時間の日付にする（11/18 15:00Z＝11/18 の分）', R['2026-11-19'] === 4708 && R['2026-11-18'] === 207241, JSON.stringify(R));
  const M = U.merge(R, { '2026-11-18': 9315 }, { '2026-11-18': 1970, '2026-11-17': 3 });
  c('読み取り・書き込み・削除を日ごとにまとめる（古い順・無い日は0）', M.length === 3 && M[0].d === '2026-11-17' && M[0].r === 0 && M[0].x === 3 && M[1].w === 9315 && M[2].r === 4708, JSON.stringify(M));
  // run: にせの admin と fetch
  const store = {};
  const admin = {
    app: () => ({ options: { projectId: 'hotlist-21865' } }),
    credential: { applicationDefault: () => ({ getAccessToken: async () => ({ access_token: 'tok' }) }) },
    firestore: () => ({ collection: (n) => ({ doc: (id) => ({ set: async (d, o) => { store[n + '/' + id] = o && o.merge ? Object.assign({}, store[n + '/' + id] || {}, d) : d; } }) }) })
  };
  const calls = [];
  global.fetch = async (u, o) => { calls.push([u, o.headers.Authorization]); const t = /read_count/.test(u) ? 'r' : /write_count/.test(u) ? 'w' : 'x';
    return { ok: true, status: 200, text: async () => JSON.stringify(pts([['2026-11-19T15:00:00Z', t === 'r' ? 100 : t === 'w' ? 10 : 1]])) }; };
  const log0 = console.log; console.log = () => {};
  await U.run(admin);
  console.log = log0;
  const s = store['appStats/usage'];
  c('3つ（読み取り・書き込み・削除）を問い合わせ、appStats/usage に書く', calls.length === 3 && calls.every((x) => x[1] === 'Bearer tok') && s && s.err === '' && s.days.length === 1 && s.days[0].r === 100 && s.days[0].w === 10 && s.days[0].x === 1, JSON.stringify(s));
  global.fetch = async () => ({ ok: false, status: 403, text: async () => 'Permission monitoring.timeSeries.list denied' });
  console.log = () => {};
  await U.run(admin);
  console.log = log0;
  c('権限が無い時は、前の数を残したまま理由（err）を書く', store['appStats/usage'].days.length === 1 && /403/.test(store['appStats/usage'].err), JSON.stringify(store['appStats/usage']));
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
