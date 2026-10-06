// v661：HOMEのタイルに写真の背景
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('menu'); await sleep(30);
  const t = $$('#view-menu .ux-t');
  c('5枚とも写真の背景', t.length === 5 && t.every(x => x.classList.contains('ph') && /img\/tile-[a-z]+\.webp/.test(x.getAttribute('style') || '')));
  c('分析は暗い写真（白い文字）', t[4].classList.contains('dk'));
  const fs = require('fs'), p = require('path');
  c('画像ファイルがある（オフライン用にSWにも）', ['plan', 'map', 'cal', 'todo', 'stats'].every(k => fs.existsSync(p.join(__dirname, '../../../img/tile-' + k + '.webp'))) && fs.readFileSync(p.join(__dirname, '../../../sw.js'), 'utf8').indexOf('img/tile-plan.webp') >= 0);
  c('v664: 左上にロゴ（ライト用・ダーク用）とHOME', $$('#view-menu .hm-hd .hm-logo').length === 2 && $('#view-menu .hm-hd h1').textContent === 'HOME' && fs.existsSync(p.join(__dirname, '../../../img/logo-w.png')));
});
