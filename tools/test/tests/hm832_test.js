// v832：HOMEのタイルの画像あり／なしを設定（見た目）で選べる（端末ごと・最初は画像あり）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  try { w.localStorage.removeItem('gm_homeImg'); } catch (e) {}
  w.switchView('menu'); await sleep(20);
  const ph = () => $$('#view-menu .ux-t.ph').length;
  c('最初は画像あり', ph() === 5 && /tile-plan\.webp/.test($('#view-menu').innerHTML));
  w._stPg = 'look'; w._stRender(); await sleep(5);
  c('設定の「見た目」に HOMEのタイル（画像あり／画像なし）', /HOMEのタイル/.test($('#setPg').textContent) && /画像なし/.test($('#setPg').textContent));
  const b = [...$$('#setPg .ppb span')].find(x => x.textContent === '画像なし'); b.click(); await sleep(10);
  c('画像なしにすると、タイルの写真が消える', ph() === 0 && !/tile-plan\.webp/.test($('#view-menu').innerHTML) && $$('#view-menu .ux-t').length === 5);
  c('端末に覚える', w.localStorage.getItem('gm_homeImg') === '0' && [...$$('#setPg .ppb span.on')].some(x => x.textContent === '画像なし'));
  w._stPg = ''; w._stRender(); await sleep(5);
  c('設定の一覧にも今の設定', /画像なし/.test($('#setPg').textContent));
  w.setClose();
  // PCなどのプロフィール設定の画面
  w.openProfileModal(); await sleep(5);
  c('プロフィール設定にも同じ切りかえ', $('#rbHomeImg0').classList.contains('sel') && !$('#rbHomeImg1').classList.contains('sel'));
  w.setHomeImg(true); await sleep(10);
  c('画像ありに戻せる', ph() === 5 && $('#rbHomeImg1').classList.contains('sel'));
  w.closeProfileModal(null);
});
