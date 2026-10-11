// v793：夢100をスワイプで消す（左＝🗑・右＝叶えた）・元に戻す・編集画面からも消せる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w._p2().dreams = [{ id: 'd1', cat: 'want', t: 'ベンツGLC', amt: 500, dl: '2027-10', done: false }, { id: 'd2', cat: 'want', t: 'ベンツGLC', amt: 500, dl: '2027-10', done: false }, { id: 'd3', cat: 'do', t: 'セブ島', done: false }];
  w.switchView('plan'); w.p2Go('dream'); await sleep(40);
  c('夢の行はスワイプできる形（🗑 消す が下に）', $$('.dr-lw[data-drid]').length === 3 && $$('.dr-lw .dr-dl').length === 3 && !!$('.dr-lw > .ln.ux-sk'));
  $$('.dr-lw[data-drid="d2"] .dr-dl')[0].click(); await sleep(20);
  c('🗑で消える（同じ名前の2つ目だけ）', w._p2().dreams.length === 2 && w._p2().dreams.some(d => d.id === 'd1') && !w._p2().dreams.some(d => d.id === 'd2') && $$('.dr-lw').length === 2);
  w._gmUndoFn(); await sleep(20);
  c('↩ 元に戻す（同じ場所に）', w._p2().dreams.length === 3 && w._p2().dreams[1].id === 'd2');
  // 編集画面から（PCはスワイプが無いので）
  w.p2DrFormOpen('d3'); await sleep(20);
  const del = $$('#p2DrFormOv span').find(x => /この夢を消す/.test(x.textContent));
  c('編集画面に「この夢を消す」', !!del);
  del.click(); await sleep(250);
  c('編集画面から消せる', !w._p2().dreams.some(d => d.id === 'd3') && !$('#p2DrFormOv.show'));
  w.p2DrFormOpen(); await sleep(20);
  c('新しく足す時は「消す」を出さない', !$$('#p2DrFormOv span').some(x => /この夢を消す/.test(x.textContent)));
});
