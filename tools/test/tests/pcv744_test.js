// v744：PCのカレンダー（左のToDoメニューはToDoの時だけ・上に 月/週/日｜ToDo）／ToDoは最初「今日」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  c('ToDoの最初の表示は「今日」（スマホ・PC共通）', w._todoFilter.type === 'today');
  setWH(1400, 900); w._uxSync && w._uxSync(); w.switchView('events'); w.setEventsMode('calendar'); await sleep(40);
  c('PCは pcv', w.document.body.classList.contains('pcv'));
  const seg = $('#evCalendar .pcv-seg');
  c('月カレンダーの上に 月・週・日｜ToDo（月がオン）', !!seg && $$('#evCalendar .pcv-seg span').map(x => x.textContent.trim()).join(',') === '月,週,日,ToDo' && /月/.test($('#evCalendar .pcv-seg span.on').textContent));
  c('「今日」と「＋ 予定」', !!$('#evCalendar .pcv-td') && /予定/.test($('#evCalendar .pcv-add').textContent));
  const css = $('#pcvCss').textContent;
  c('カレンダーでは左のToDoメニューを出さない（幅いっぱい）', /#pcCalSide\{display:none!important\}/.test(css) && /margin-left:0!important/.test(css));
  $$('#evCalendar .pcv-seg span')[1].click(); await sleep(30);
  c('週を押すと週', w._evMode === 'week' && /週/.test($('#evWeek .pcv-seg span.on').textContent));
  $$('#evWeek .pcv-seg span')[3].click(); await sleep(30);
  c('ToDoを押すとToDo（左にToDoのメニュー）', w._evMode === 'agenda' && /ToDo/.test($('#evAgenda .pcv-seg span.on').textContent) && !$('#evAgenda .pcv-add'));
  $$('#evAgenda .pcv-seg span')[2].click(); await sleep(30);
  c('日を押すと日', w._evMode === 'day');
  setWH(390, 844); w._uxSync && w._uxSync(); w.setEventsMode('calendar'); await sleep(20);
  c('スマホは pcv なし（下の帯のまま）', !w.document.body.classList.contains('pcv'));
});
