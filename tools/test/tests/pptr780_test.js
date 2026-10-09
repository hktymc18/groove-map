// v780（#10）：スマホのメンバー画面の「研修」は、今までの編集画面に飛ばず、この画面の中で記録できる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '永尾', firstName: '歩夢', title: 'BR', parentId: '', mapType: 'both' },
    { id: 't', lastName: '別所', firstName: '星哉', title: 'OUT', parentId: 'r', mapType: 'both', trainee: true,
      traineeHistory: [{ status: 'PG', date: '2026-09-23', aSan: '小川拓郎', result: 'next' }, { status: 'DLR', date: '2026-09-23', aSan: '平井凛太郎', result: 'next' }, { status: 'PA', date: '2026-10-01', aSan: '', result: 'left' }], traineeResult: '流れた' }];
  w.switchView('current'); await sleep(30);
  w.ppOpen('t', 'current'); await sleep(20);
  const tile = $('#ppPg [onclick="ppOld(2)"]');
  c('メンバー画面に「研修」', !!tile && /研修/.test(tile.textContent));
  tile.click(); await sleep(30);
  const modal = w.document.getElementById('modal');
  c('今までの編集画面は出ない（新しい画面のまま）', !!$('#ppPg') && w._pp.pg === 'tr' && w.document.body.classList.contains('pp-silent') && /研修/.test($('#ppPg .ux-crumb').textContent));
  c('研修結果・研修履歴・ステップを追加がこの画面の中に', !!$('#ppPg #traineeStatusFields') && /研修結果/.test($('#ppPg').textContent) && /ステップを追加/.test($('#ppPg').textContent) && $$('#ppPg .th-entry').length === 3);
  w.selTraineeResultChip('BC'); await sleep(10);
  c('結果を選べる', w.document.getElementById('fTraineeResult').value === 'BC');
  $('#ppPg .ux-btm .ux-nx').click(); await sleep(30);
  const m = w.state.members.find(x => x.id === 't');
  c('「保存して戻る」で保存（結果がBC）', m.traineeResult === 'BC' && w._pp && w._pp.pg === '');
  c('借りた部分は元の画面に戻り、編集画面は閉じたまま', !$('#ppPg #traineeStatusFields') && !!w.document.querySelector('#modal #traineeStatusFields') && !modal.classList.contains('open') && !w.document.body.classList.contains('pp-silent'));
  // 研修の画面を開いたまま閉じても保存される
  w.ppOld(2); await sleep(20); w.selTraineeResultChip('流れた'); w.ppClose(); await sleep(20);
  const m2 = w.state.members.find(x => x.id === 't');
  c('研修の画面から閉じても保存', m2.traineeResult === '流れた' && !w.document.body.classList.contains('pp-silent') && !$('#ppPg'));
});
