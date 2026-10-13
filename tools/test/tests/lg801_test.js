// v801：NWPのロゴは<img>ではなく背景で表示（ブラウザの「画像を保存」・長押し・ドラッグで持ち出せない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.switchView('menu'); await sleep(40);
  c('ホームのロゴに<img>を使わない', $$('#view-menu .hm-hd .hm-logo').length === 2 && !$('#view-menu .hm-hd img') && $$('#view-menu .hm-hd .gm-lg').every(x => x.tagName === 'I' && x.getAttribute('aria-label') === 'NWP'));
  c('どの画面にもNWPのロゴの画像要素がない', !$$('img').some(x => /logo-[wd]\.png/.test(x.getAttribute('src') || '')));
  const css = [...w.document.querySelectorAll('style')].map(s => s.textContent).join('');
  c('長押し・選択・ポインタを止める指定', /\.gm-lg\{[^}]*-webkit-touch-callout:none[^}]*pointer-events:none/.test(css) && /\.gm-lg\.w\{background-image:url\(img\/logo-w\.png\)\}/.test(css));
});
