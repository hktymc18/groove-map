// v671：完了タスク・ゴミ箱からToDoへ戻れる（‹ボタン・下のToDo）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('events'); w.setEventsMode('agenda'); await sleep(50);
  w.todoNavTo('smart', 'done'); await sleep(30);
  c('完了タスクでは ‹（戻る）を出す', $('#tdHdrX').classList.contains('td-back') && $('#tdHdrX').textContent === '‹');
  c('新デザインでも ‹ は表示される（CSS）', /#tdHdrX\.td-back\{display:flex!important/.test(String(w._cvCss)));
  w.todoHdrBack(); await sleep(30);
  c('‹ でToDoの一覧へ', w._todoNav.type === 'home' && !$('#tdHdrX').classList.contains('td-back'));
  w.todoNavTo('smart', 'trash'); await sleep(30);
  c('ゴミ箱でも ‹ を出す', $('#tdHdrX').classList.contains('td-back'));
  w.cvTodoTab(); await sleep(30);
  c('下の「ToDo」を押してもToDoの一覧へ', w._todoNav.type === 'home');
});
