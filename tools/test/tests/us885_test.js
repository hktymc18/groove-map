// v885：アカウント管理（オーナー）の設定「📊 利用状況」。開いた人・使える人・Firestore 全体の回数（appStats/usage）・読み取りの内訳（readStats）（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const day = (off) => new w.Date(w.Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const at = (off) => new w.Date(w.Date.now() - off * 86400000).toISOString();
  w._adminUsers = [
    { id: 'u1', name: '見本 一', status: 'active', early: true, lastSeenAt: at(0) },
    { id: 'u2', name: '見本 二', status: 'active', early: true, lastSeenAt: at(1) },
    { id: 'u3', name: '見本 三', status: 'active', lastSeenAt: at(3) },
    { id: 'u4', name: '見本 四', status: 'pending' },
    { id: 'u5', name: '見本 五', status: 'disabled', deleted: true, lastSeenAt: at(0) }
  ];
  w._accA = { mode: 'early' };
  const reads = [];
  const stats = { days: [{ d: day(1), r: 207241, w: 9315, x: 1970 }, { d: day(0), r: 30000, w: 800, x: 10 }], at: at(0), err: '' };
  const rs = [{ uid: 'u1', app: 'nav', n: 1200, by: { 'current|maps/months': 300, 'events|maps/events': 900 } }, { uid: '', app: 'ck', n: 50, by: { 'vCard:home|cards': 50 } }];
  const db0 = w.db;
  w.db = Object.assign({}, db0, {
    doc: (p) => ({ get: () => { reads.push(p); return Promise.resolve({ exists: p === 'appStats/usage', data: () => JSON.parse(JSON.stringify(stats)) }); } }),
    collection: (n) => ({ doc: (d) => ({ collection: (m) => ({ get: () => { reads.push(n + '/' + d + '/' + m); return Promise.resolve({ forEach: (f) => rs.forEach((x) => f({ data: () => JSON.parse(JSON.stringify(x)) })) }); } }) }) })
  });
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminPanel" class="open"></div><div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'set'; w._admPg = '';
  w.renderAdminList();
  let html = $('#adminBody').innerHTML;
  c('設定のいちばん上に「📊 利用状況」（今日開いた人 1人）', /📊 利用状況/.test(html) && /今日 開いた人 1人/.test(html), html.slice(0, 300));
  w.admPg('us'); await sleep(50);
  html = $('#adminBody').innerHTML;
  const tx = $('#adminBody').textContent;
  c('開いた人: 今日1・直近7日3・登録4（削除したアカウントは数えない）', /1今日/.test(tx) && /3直近7日/.test(tx) && /4登録している人/.test(tx), tx.slice(0, 200));
  c('使える人2・まだ1・承認待ち1', /2使える（解放済み）/.test(tx) && /1承認ずみで、まだ/.test(tx) && /1承認待ち/.test(tx));
  c('Firestore 全体の回数（appStats/usage を1回だけ読む）・無料枠を超えた日は赤', reads.filter((p) => p === 'appStats/usage').length === 1 && /207,241/.test(tx) && /class="ov"/.test(html));
  c('書き込み・削除（昨日）と1人あたりの読み取り', /書き込み（昨日）9,315/.test(tx) && /1人あたりの読み取り（今日・ここまで）約30,000回/.test(tx), tx.slice(0, 800));
  c('内訳は押すまで読まない', !reads.some((p) => /readStats/.test(p)) && /日を押すと読み込みます/.test(tx));
  w.usRdLoad(0); await sleep(50);
  const tx2 = $('#adminBody').textContent;
  c('「今日」を押すと、その日の readStats を読む', reads.some((p) => p === 'readStats/' + day(0).replace(/-/g, '') + '/u'));
  c('アプリ別（NAVIGATOR 1,200・受付 50）と全体に占める割合', /1,200NAVIGATOR（1人・端末・1人 約1,200）/.test(tx2) && /50受付・会員証/.test(tx2) && /約4%/.test(tx2), tx2.slice(tx2.indexOf('読み取りの内訳'), tx2.indexOf('読み取りの内訳') + 250));
  c('画面ごと・画面｜場所の多い順', /NAV events900/.test(tx2) && /NAV events\|maps\/events900/.test(tx2) && tx2.indexOf('NAV events|maps/events') < tx2.indexOf('NAV current|maps/months'));
  // まだ記録が無い時
  w._us = { stats: { none: true }, loading: false, rd: {}, rdDay: '' };
  w.renderAdminList();
  c('記録が無い時は、関数のデプロイを案内', /firebase deploy --only functions:usageStats/.test($('#adminBody').textContent));
  w._us = { stats: { days: [], err: 'monitoring 403 denied' }, loading: false, rd: {}, rdDay: '' };
  w.renderAdminList();
  c('取れなかった時は理由と権限の案内', /取れませんでした：monitoring 403/.test($('#adminBody').textContent) && /モニタリング閲覧者/.test($('#adminBody').textContent));
  w.db = db0;
  c('APP_JS_VERSION v885 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 885);
});
