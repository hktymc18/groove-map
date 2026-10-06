// v612：予定（スマホ）の上下の帯・上スワイプ／日タップで「その日の予定」・横向き
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); w._cvNew = () => w._cvOn(); // v620で止めた新しい入力（コードは残す）を確かめる
  w.state.members = [{ id: 'a1', lastName: '佐藤', firstName: '花', title: 'PG', parentId: '', mapType: 'both' }];
  const E = (id, d, tm, t, x) => Object.assign({ id, date: d, time: tm, title: t, type: 'event', memberIds: [], createdAt: d + 'T00:00:00' }, x || {});
  w.state.events = [E('e1', '2026-10-13', '19:00', 'CT 鈴木さん', { endTime: '20:00', memberIds: ['a1'], place: 'オンライン' }), E('e2', '2026-10-13', '20:00', 'ST'), E('e3', '2026-10-06', '20:00', 'ST'),
    E('e4', '2026-10-13', '', '名簿を送る', { type: 'task' }), E('e5', '2026-10-20', '', '合宿', { endDate: '2026-10-22' })];
  setWH(390, 844);
  w.switchView('events'); w.setEventsMode('calendar'); await sleep(60);
  console.log('=== ① 上下の帯（カレンダー本体は今のまま） ===');
  c('スマホは body.cv2', w.document.body.classList.contains('cv2'));
  c('カレンダー本体（今の帯）は残る', $$('#evCalGrid .ev-bar[data-eid]').length >= 3 && $('#evCalGrid .ev-bar[data-eid="e1"]').textContent.indexOf('CT 鈴木さん') >= 0);
  const hd = $('#evCalendar .ev-cal-hdr');
  c('上：今日・🔍・⋯', !!hd.querySelector('.cv-td') && hd.querySelectorAll('.cv-ib').length === 2);
  const bt = $('#evCalendar .ev-cal-bottom');
  c('下：HOMEのマーク・月週日ToDo・＋予定', bt.classList.contains('cv-b') && !!bt.querySelector('.cv-bk svg') && [...bt.querySelectorAll('.cv-seg span')].map(x => x.firstChild.textContent).join() === '月,週,日,ToDo' && bt.querySelector('.cv-add').textContent.indexOf('予定') >= 0);
  c('週・日・ToDoの下の帯もそろう', ['evWeek', 'evDayV', 'evAgenda'].every(id => $('#' + id + ' .ev-cal-bottom.cv-b')) && $('#evAgenda .cv-add').textContent.indexOf('ToDo') >= 0);
  console.log('=== ② 上にスワイプ → その日の予定 ===');
  const sw = (el, x0, y0, x1, y1) => {
    const ts = new w.Event('touchstart'); ts.touches = [{ clientX: x0, clientY: y0 }]; el.dispatchEvent(ts);
    const te = new w.Event('touchend'); te.changedTouches = [{ clientX: x1, clientY: y1 }]; el.dispatchEvent(te);
  };
  sw($('#evCalGrid'), 200, 600, 205, 400);
  c('上スワイプで分割・今日が選ばれる', $('#evCalendar').classList.contains('cv-on') && w._calSelDate === '2026-10-14');
  w.selCalDay('2026-10-13'); await sleep(20);
  c('日タップ：シートは出ない', !w.document.getElementById('dayShOv'));
  const rows = $$('#cvDayLs .cvr');
  c('予定2件＋タスク1件', rows.length === 3, rows.length);
  c('時刻〜終了・だれと・場所', rows[0].textContent.indexOf('〜20:00') >= 0 && rows[0].textContent.indexOf('佐藤 花') >= 0 && rows[0].textContent.indexOf('オンライン') >= 0);
  c('小さな月に短いラベル', [...$$('.cvm-c[data-ds="2026-10-13"] u')].map(u => u.textContent).join() === 'CT,ST');
  w.selCalDay('2026-10-20'); c('連日の予定は「〜10/22」', $('#cvDayLs').textContent.indexOf('〜10/22') >= 0);
  let added = null; const oA = w.openEventAddDate; w.openEventAddDate = d => { added = d; };
  w.selCalDay('2026-10-20'); c('同じ日をもう一度タップ → その日に追加', added === '2026-10-20');
  w.openEventAddDate = oA;
  sw($('#cvMini'), 300, 200, 100, 205); await sleep(10);
  c('左スワイプで翌月', w._calMonth === 10 && w._calSelDate === '2026-11-01');
  w.cvToday(); c('今日ボタン', w._calMonth === 9 && w._calSelDate === '2026-10-14');
  sw($('#cvDayHd'), 200, 400, 202, 520);
  c('下にスワイプで全体に戻る', !$('#evCalendar').classList.contains('cv-on'));
  w.cvSplit(true); w.cvBack(); c('‹戻る：分割中はまず全体へ', !$('#evCalendar').classList.contains('cv-on') && w.currentView === 'events');
  console.log('=== ③ 横向き・PC ===');
  setWH(844, 390); w.switchView('events'); w.setEventsMode('calendar'); w._uxSync(); await sleep(30);
  c('横は最初から分割（縦向きの案内なし）', $('#evCalendar').classList.contains('cv-on') && !w.document.body.classList.contains('ux-ev'));
  setWH(1400, 900); w._uxSync(); w.setEventsMode('calendar'); await sleep(30);
  c('PCは cv2 なし', !w.document.body.classList.contains('cv2') && !$('#evCalendar').classList.contains('cv-on'));
});
