// v659：MAPの段（開いた時は2段・全段が光るのは押した時だけ）／スマホ横でサークルMAP
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 3000 }];
  for (let i = 0; i < 2; i++) { ms.push({ id: 'f' + i, lastName: '前' + i, title: 'BR', parentId: 'r', mapType: 'both' }); ms.push({ id: 'g' + i, lastName: '下' + i, title: 'B1', parentId: 'f' + i, mapType: 'both' }); ms.push({ id: 'h' + i, lastName: '孫' + i, title: 'PG', trainee: true, parentId: 'g' + i, mapType: 'both' }); }
  w.state.members = ms; w.localStorage.setItem('gm_mapLevel', 'all');
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('current'); await sleep(40);
  const on = () => $$('.mx3 .mxc.on').map(x => x.textContent.trim());
  c('開いた時は2段が光る（前回の全段は持ち越さない）', on().length === 1 && on()[0].indexOf('2段') === 0);
  w.mxLevel('all'); await sleep(20);
  c('全段を押すと全段が光り、全部開く', on()[0] === '全段' && w._treeOpen['g0'] === true);
  w.mxLevel('2'); await sleep(20);
  c('2段に戻す', on()[0].indexOf('2段') === 0);
  console.log('=== 横のサークルMAP ===');
  setWH(844, 390); w.dispatchEvent(new w.Event('resize')); await sleep(40);
  c('v662: 縦で開いてから横にしても「◎ サークル」が出る', $('.mx1').textContent.indexOf('サークル') >= 0);
  setWH(844, 390); w._uxSync && w._uxSync(); w.switchView('current'); await sleep(40);
  c('横向きは上に「◎ サークル」', $('.mx1').textContent.indexOf('サークル') >= 0);
  w.mxOrbitOpen(); await sleep(30);
  c('サークルMAPを全画面で（全員の丸）', !!$('#mxOrbit svg') && $$('#mxOrbit svg .oval-node').length === ms.length);
  w.mxOrbitZoom(1); c('＋で拡大', w._mxOz > 1);
  w.mxOrbitClose(); c('✕で閉じる', !$('#mxOrbit'));
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('current'); await sleep(20);
  c('縦は「サークル」ボタンなし', $('.mx1').textContent.indexOf('サークル') < 0);
});
