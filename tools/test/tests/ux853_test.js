// #37 v853：MAPの上の帯（_mxTop）を、地図の描画（_mxRender）を通らずに作っても、帯の見た目（mxCss）が読み込まれる
// #38 v853：MAPの「ビジネス｜ユーザー」の「?」から開く説明（uxInfo）は、ほかの画面を開いていなくても
//   見た目つき（画面いっぱいの重ね）で出て、OK・外側を押すと消える
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const old = w.document.getElementById('ux2Css'); if (old) old.parentNode.removeChild(old);
  c('前提：説明の見た目はまだ読み込まれていない', !w.document.getElementById('ux2Css'));
  w.uxInfo('um_sw'); await sleep(10);
  const ov = $('#uxInfo');
  c('説明が開く', !!ov && ov.textContent.indexOf('ビジネスとユーザー') >= 0);
  c('見た目（#uxInfo の重ね）が読み込まれる', !!w.document.getElementById('ux2Css') && /#uxInfo\{position:fixed/.test(w.document.getElementById('ux2Css').textContent));
  ov.querySelector('.ok').click(); await sleep(10);
  c('OKで消える', !$('#uxInfo'));
  w.uxInfo('um_sw'); await sleep(10);
  const ov2 = $('#uxInfo'); ov2.onclick({ target: ov2 }); await sleep(10);
  c('外側を押しても消える', !$('#uxInfo'));
  // #37
  const mx = w.document.getElementById('mxCss'); if (mx) mx.parentNode.removeChild(mx);
  c('前提：MAPの帯の見た目はまだ読み込まれていない', !w.document.getElementById('mxCss'));
  try { w._mxTop('current'); } catch (e) { c('上の帯を作れる ' + e.message, false); }
  c('上の帯を作ると見た目も読み込まれる', !!w.document.getElementById('mxCss') && !!$('#mxTop'));
  const mx2 = w.document.getElementById('mxCss'); if (mx2) mx2.parentNode.removeChild(mx2);
  try { w._mxBtm('current'); } catch (e) {}
  c('下の帯でも読み込まれる', !!w.document.getElementById('mxCss'));
});
