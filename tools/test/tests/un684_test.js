// v684：ユニオン予定はHOMEではなく「設定 › カレンダー」の中
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); w.currentUser.union = 'GRANT'; setWH(390, 844);
  w.switchView('menu'); w.renderMenuHub(); await sleep(20);
  c('HOMEの下のボタンにユニオン予定はない', $('#view-menu .ux-sm').textContent.indexOf('ユニオン予定') < 0);
  let opened = 0; w.openUnionListSheet = () => { opened++; };
  w.openCalSettings(); await sleep(10);
  c('カレンダー設定の一番上にユニオン予定', !!$('#calSetOv') && /GRANTのユニオン予定を見る/.test($('#calSetOv').textContent));
  [...w.document.querySelectorAll('#calSetOv button')].find(b => /ユニオン予定/.test(b.textContent)).click(); await sleep(10);
  c('押すとユニオン予定が開く', opened === 1, opened);
});
