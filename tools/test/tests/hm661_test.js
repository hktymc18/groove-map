// v661：HOMEのタイルに写真の背景
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('menu'); await sleep(30);
  const t = $$('#view-menu .ux-t');
  c('5枚とも写真の背景', t.length === 5 && t.every(x => x.classList.contains('ph') && /img\/tile-[a-z]+\.webp/.test(x.getAttribute('style') || '')));
  const css = $('#uxMenuCss').textContent;
  c('v665: 写真・アイコン色のCSSが入っている（途中で切れていない）', css.indexOf('.ux-t.ph{background:var(--img)') >= 0 && css.indexOf('.ux-t .ic .lic{width:48px') >= 0);
  c('分析は暗い写真（白い文字）', t[2].classList.contains('dk'));
  c('v683: PLANの下は MAP・ANALYSIS／CALENDAR・TODO の順', t.slice(1).map(x => x.querySelector('b,.lb,h3') ? x.textContent : x.textContent).every((x, i) => x.indexOf(['MAP', 'ANALYSIS', 'CALENDAR', 'TODO'][i]) >= 0));
  const fs = require('fs'), p = require('path');
  c('画像ファイルがある（オフライン用にSWにも）', ['plan', 'map', 'cal', 'todo', 'stats'].every(k => fs.existsSync(p.join(__dirname, '../../../img/tile-' + k + '.webp'))) && fs.readFileSync(p.join(__dirname, '../../../sw.js'), 'utf8').indexOf('img/tile-plan.webp') >= 0);
  c('v664: 左上にロゴ（ライト用・ダーク用）とHOME', $$('#view-menu .hm-hd .hm-logo').length === 2 && $('#view-menu .hm-hd h1').textContent === 'HOME' && fs.existsSync(p.join(__dirname, '../../../img/logo-w.png')));
});
