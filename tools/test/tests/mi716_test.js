// v716：MAP画面（PC）の右に課題パネル（現状／理想を切りかえても出たまま・人を押すと課題・自分・全体のメモ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900); w._uxSync && w._uxSync(); await sleep(20);
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }, { id: 'a', lastName: '井上', firstName: '花', title: 'LOI', parentId: 'r', mapType: 'both' }];
  w.switchView('current'); await sleep(30);
  c('MAPの上の帯に「📝 課題」', !!$('#pcToolbarC .pt-iss') && !!$('#pcToolbarI .pt-iss'));
  w.mapIssTgl(); await sleep(20);
  c('押すと右に課題パネル', !!$('#mapIssP') && $('#mapIssP').style.display !== 'none' && w.document.body.classList.contains('map-iss') && !!$('#mapIssP .iss-fi'));
  w.mapIssTap('a'); await sleep(60);
  const ta = $('#mapIssP #mapIssIn');
  c('人を押すと、パネルでその人の課題を書ける', !!ta && /井上/.test($('#mapIssP').textContent));
  ta.value = '審査フォロー'; ta.onchange(); w.p2ShIssDone(); await sleep(20);
  c('書いた課題は計画シートと同じ所に入る', w._p2ShIss(w._p2ShYmN()).a === '審査フォロー' && /審査フォロー/.test($('#mapIssP').textContent));
  w.switchView('ideal'); await sleep(40);
  c('理想MAPに切りかえても出たまま', $('#mapIssP').style.display !== 'none' && /審査フォロー/.test($('#mapIssP').textContent) && /理想MAP/.test($('#mapIssP .mi-h').textContent));
  const fi = $('#mapIssP .iss-fi'); fi.value = 'ST会場を探す'; w.p2ShIssFAdd(fi); await sleep(20);
  c('自分・全体のメモもパネルで書ける', /ST会場を探す/.test($('#mapIssP').textContent));
  w.switchView('plan'); await sleep(30);
  c('PLANでは出さない', $('#mapIssP').style.display === 'none');
  w.switchView('current'); await sleep(30); w.mapIssTgl(); await sleep(10);
  c('もう一度押すと閉じる（端末に覚える）', $('#mapIssP').style.display === 'none' && w.localStorage.getItem('gm_mapIss') === '0');
});
