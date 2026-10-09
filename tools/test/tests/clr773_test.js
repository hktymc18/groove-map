// v773：設定の「組織MAPをクリア」を削除
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
const fs = require('fs'), p = require('path'), R = p.join(__dirname, '../../..');
T.run(async () => {
  T.login();
  c('関数がない', typeof w.clearMapData === 'undefined');
  c('index.html（旧プロフィール画面）にボタンがない', fs.readFileSync(R + '/index.html', 'utf8').indexOf('clearMapData') < 0);
  T.setWH(390, 844); w._stPg = ''; w._stRender(); await sleep(30);
  const pg = $('#setPg'), items = pg ? T.$$('#setPg .st-ls > div').map(e => { const t = e.children[1]; return t && t.firstChild ? t.firstChild.textContent : ''; }) : []; // 項目名だけ（お知らせの本文は除く）
  c('設定の項目に「組織MAPをクリア」が出ない（ログアウトはある）', items.some(t => /ログアウト/.test(t)) && !items.some(t => /組織MAPをクリア/.test(t)) && pg.innerHTML.indexOf('clearMapData') < 0, items.length);
});
