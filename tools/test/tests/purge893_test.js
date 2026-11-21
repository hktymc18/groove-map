// v893：アカウント管理（オーナー）の「削除したアカウント」に「完全に消す」（予約を付けるだけ・消すのはサーバー）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  w._adminUsers = [
    { id: 'u1', name: '見本 はなこ', email: 'hanako@example.com', union: 'REVE', status: 'disabled', deleted: true, deletedFrom: 'active' },
    { id: 'u2', name: '見本 太郎', email: 'taro@example.com', union: 'REVE', status: 'active' },
    { id: 'u3', name: '見本 管理', email: 'adm@example.com', union: 'REVE', status: 'disabled', deleted: true, role: 'admin' },
    { id: 'u4', name: '見本 受付', email: 'ck@example.com', union: 'REVE', status: 'disabled', deleted: true, purge: { req: false, err: '受付のアカウントもあるので消していません（受付でも同じログインを使っています）' } }
  ];
  const writes = []; w.fsSet = (p, d) => { writes.push([p, JSON.parse(JSON.stringify(d))]); return Promise.resolve(); };
  const asks = []; let ans = true; w.confirm = m => { asks.push(m); return ans; };
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'acc'; w._admPg = ''; w._admF = 'del';
  w.renderAdminList();
  let html = $('#adminBody').innerHTML;
  c('削除したアカウントに「完全に消す」（元に戻す の横）', /admPurge\('u1'\)/.test(html) && /admUndelUser\('u1'\)/.test(html) && /完全に消す/.test(html));
  c('管理者には出さない', !/admPurge\('u3'\)/.test(html));
  c('サーバーが消さなかった時は理由を出す', /完全には消していません：受付のアカウントもある/.test(html));
  w._admF = 'all'; w.renderAdminList();
  c('削除していない人には出さない', !/admPurge\('u2'\)/.test($('#adminBody').innerHTML));
  w._admF = 'del';
  // やめた時は何もしない
  ans = false; w.admPurge('u1'); await sleep(10);
  c('確かめる（消えるもの・元に戻せない・いつ消すか）', /ログインのアカウント・アカウントの情報・このアカウントのMAP/.test(asks[0]) && /元に戻せません/.test(asks[0]) && /時ごろ/.test(asks[0]) && writes.length === 0);
  ans = true; w.admPurge('u1'); await sleep(10);
  c('予約を付ける（purge.req・オーナー・日時）', writes.length === 1 && writes[0][0] === 'users/u1' && writes[0][1].purge.req === true && writes[0][1].purge.by === w.currentUser.uid);
  html = $('#adminBody').innerHTML;
  c('予約中は「完全に消す予定（○時ごろ）」と「消すのをやめる」・元に戻すは出さない', /完全に消す予定（(今日|明日)の\d+時ごろ）/.test(html) && /admPurgeCancel\('u1'\)/.test(html) && !/admUndelUser\('u1'\)/.test(html));
  w.admUndelUser('u1'); await sleep(5);
  c('予約中は元に戻さない（先にやめる）', writes.length === 1);
  w.admPurgeCancel('u1'); await sleep(10);
  c('やめると予約を外す', writes.length === 2 && writes[1][1].purge.req === false && /admUndelUser\('u1'\)/.test($('#adminBody').innerHTML));
  // 次に消す時刻
  const t0 = w.Date.now;
  w.Date.now = () => Date.parse('2026-11-21T01:30:00Z'); c('10:30 なら「今日の12時ごろ」', w._admPurgeNext() === '今日の12時ごろ');
  w.Date.now = () => Date.parse('2026-11-21T13:00:00Z'); c('22:00 なら「明日の9時ごろ」', w._admPurgeNext() === '明日の9時ごろ');
  w.Date.now = t0;
  c('APP_JS_VERSION v893 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 893);
});
