// v773：設定の「組織MAPをクリア」を削除
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
const fs = require('fs'), p = require('path'), R = p.join(__dirname, '../../..');
T.run(async () => {
  T.login();
  c('関数がない', typeof w.clearMapData === 'undefined');
  c('index.html（旧プロフィール画面）にボタンがない', fs.readFileSync(R + '/index.html', 'utf8').indexOf('clearMapData') < 0);
  T.setWH(390, 844); w._stPg = ''; w._stRender(); await sleep(30);
  const pg = $('#setPg'), tx = pg ? pg.textContent : '';
  c('設定の画面に「組織MAPをクリア」が出ない（ログアウトはある）', !!pg && /ログアウト/.test(tx) && tx.indexOf('組織MAPをクリア') < 0, tx.slice(-80));
});
