// v855：ToDoの最初の表示（すべて／今日）を ⋯ の設定で選べる（端末ごと・最初は今日）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.localStorage.removeItem('gm_tdDef');
  c('設定がない時は「今日」', w._tdDefType() === 'today');
  w.switchView('events'); w.setEventsMode('agenda'); await sleep(60);
  w.openCalSettings(); await sleep(10);
  const ov = () => $('#calSetOv'), row = () => Array.from(ov().querySelectorAll('.fr')).find(f => /ToDoの最初の表示/.test(f.textContent));
  c('⋯の設定に「ToDoの最初の表示」（すべて／今日）', !!row() && /すべて/.test(row().textContent) && /今日/.test(row().textContent) && /今日/.test(row().querySelector('.rb.sel').textContent));
  row().querySelectorAll('.rb')[0].click(); await sleep(60);
  c('すべてを選ぶと保存・すぐ「すべて」に', w.localStorage.getItem('gm_tdDef') === 'all' && w._todoFilter.type === 'all' && /すべて/.test(row().querySelector('.rb.sel').textContent));
  const sel = () => ($$('.td-fchip.sel')[0] || {}).textContent || '';
  w.renderAgenda(); await sleep(30);
  c('ToDoの一覧も「すべて」が選ばれている', /すべて/.test(sel()));
  // リストの絞り込みが消えた時なども、選んだ方に戻る
  w._todoFilter = { type: 'list', id: 'nai' }; w.renderAgenda(); await sleep(30);
  c('無くなったリストの絞り込みは、選んだ最初の表示に戻る', w._todoFilter.type === 'all');
  row().querySelectorAll('.rb')[1].click(); await sleep(60);
  c('今日に戻せる', w.localStorage.getItem('gm_tdDef') === 'today' && w._todoFilter.type === 'today');
  c('設定画面の見出しは前のまま', /カレンダー設定/.test(ov().textContent));
});
