// v748：課題パネル（計画シート・MAP）で書いた課題・メモを 🗑 で消せる（↩ 元に戻す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); await sleep(40);
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '' }, { id: 'm1', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r' }, { id: 'm2', lastName: '田中', firstName: '健', title: 'B1', parentId: 'r' }];
  w.state.idealMembers = [];
  w.p2Go('sheet'); await sleep(30);
  const ym = w._p2Ym(0);
  w.p2ShIssTap('m1'); await sleep(40); $('#p2ShIssIn').value = '審査フォロー'; $('#p2ShIssIn').onchange(); w.p2ShIssDone(); await sleep(20);
  w.p2ShIssTap('m2'); await sleep(40); $('#p2ShIssIn').value = 'OLが止まっている'; $('#p2ShIssIn').onchange(); w.p2ShIssDone(); await sleep(20);
  c('書いた課題の行に🗑', $$('.iss-r .h .dl').length === 2);
  const row = $$('.iss-r').find(r => /審査フォロー/.test(r.textContent));
  row.querySelector('.h .dl').click(); await sleep(20);
  c('🗑で人の課題が消える（ほかはそのまま）', !w._p2ShIss(ym).m1 && w._p2ShIss(ym).m2 === 'OLが止まっている' && !/審査フォロー/.test($('.iss').textContent));
  w._gmUndoFn(); await sleep(20);
  c('↩ 元に戻す', w._p2ShIss(ym).m1 === '審査フォロー' && /審査フォロー/.test($('.iss').textContent));
  w.p2ShIssTap('m2'); await sleep(40);
  c('書いている時も🗑（完了の横）', !!$('.iss-r.on .h .dl'));
  $('.iss-r.on .h .dl').click(); await sleep(20);
  c('書いている時に🗑で消える', !w._p2ShIss(ym).m2 && !$('#p2ShIssIn'));
  // 自分・全体のメモ
  const fi = $('.iss-fi'); fi.value = '名刺を作る'; w.p2ShIssFAdd(fi); await sleep(40);
  const fr = $$('.iss-r').find(r => /名刺を作る/.test(r.textContent));
  c('自分・全体のメモにも🗑', !!fr && !!fr.querySelector('.h .dl'));
  fr.querySelector('.h .dl').click(); await sleep(20);
  c('メモが消える（確認なし）', !(w._p2ShM(ym).issF || []).length && !/名刺を作る/.test($('.iss').textContent));
  w._gmUndoFn(); await sleep(20);
  c('メモも ↩ 元に戻す', (w._p2ShM(ym).issF || []).length === 1);
});
