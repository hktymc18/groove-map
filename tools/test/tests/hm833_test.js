// v833：ダークモードのHOMEのタイル（画像あり）は「浮いたカード」。枠をなくしてマスクを写真ぴったりに（前は枠の下から写真がのぞいてズレて見えた）。ライトは今まで通り
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  try { w.localStorage.removeItem('gm_homeImg'); } catch (e) {}
  w.switchView('menu'); await sleep(20);
  const css = ($('#uxMenuCss') || {}).textContent || '';
  c('ダーク：枠をなくして下にやわらかい影', /body:not\(\.light\) #view-menu \.ux-t\.ph\{border:0!important;box-shadow:0 8px 20px rgba\(0,0,0,\.55\)!important\}/.test(css));
  c('ダーク：ふちは上に重ねた細い線（上だけ少し明るい）', /body:not\(\.light\) #view-menu \.ux-t\.ph:after\{[^}]*inset 0 0 0 1px rgba\(255,255,255,\.14\),inset 0 1px 0 rgba\(255,255,255,\.35\)/.test(css));
  c('ライトの見た目は変えない（枠と影は前のまま）', /#view-menu \.ux-t\.ph\{background:var\(--img\) center\/cover no-repeat!important;border-color:rgba\(255,255,255,\.55\)!important;box-shadow:0 6px 18px rgba\(20,30,50,\.12\)\}/.test(css) && !/body\.light #view-menu \.ux-t\.ph:after/.test(css));
  c('前のダークの枠（ズレの元）はなくした', !/body:not\(\.light\) #view-menu \.ux-t\.ph\{border-color:rgba\(255,255,255,\.12\)/.test(css));
});
