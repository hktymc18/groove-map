// v723→v736：計画シートの行動の実行期日（押すと「ToDo か 予定」を選んで日時を入れる・勝手に今日が入らない）
//   ToDo＝ToDoのタスク（チェックはToDoと連動）／予定＝カレンダーの予定（チェックは手で）／ToDoで消したら「消しました」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('sheet'); await sleep(80);
  c('期日のマスは押すと窓（日付の入力を直接出さない）', !$('.sp-at input[type=date]') && $$('.sp-at .d.dd').length >= 4);
  w.p2ShDtNew('front', 0); await sleep(30);
  c('書く前に押すと「先に行動を書いて」', !$('#p2ShDtOv'));
  const t0 = $('#p2ShIn_front_0'); t0.value = 'リストアップ'; w.p2ShDtNew('front', 0); await sleep(30);
  const e1 = w.state.events.find(e => e.title === 'リストアップ');
  c('書いてから押すと行動になって窓が開く（ToDo／予定を選ぶ・日付は空）', !!e1 && !!$('#p2ShDtOv') && /ToDoに入れる/.test($('#p2ShDtOv').textContent) && /予定に入れる/.test($('#p2ShDtOv').textContent) && $('#p2ShDtD').value === '' && !$('#p2ShDtT'));
  w.p2ShDtOk(); await sleep(20);
  c('日にちを選ばないと入れない（勝手に今日にしない）', !e1.date && !!$('#p2ShDtOv'));
  $('#p2ShDtD').value = '2026-10-20'; w.p2ShDtOk(); await sleep(40);
  c('ToDoに入れる：ToDoのタスク・期日のマスに日付とToDo', e1.type === 'task' && e1.date === '2026-10-20' && !$('#p2ShDtOv') && /10\/20/.test($('.sp-at .r:not(.nw) .d').textContent) && /ToDo/.test($('.sp-at .r:not(.nw) .d').textContent));
  w.toggleEventDone(e1.id); w.renderPlan(); await sleep(30);
  c('ToDoでチェックすると計画シートにもチェック', !!$('.sp-at .r.dn'));
  const e2 = w._tdMakeTask('サンプルを渡す', '', ''); e2.planYm = w._p2Ym(0); e2.planCat = 'dist'; w.state.events.push(e2); w.renderPlan(); await sleep(30);
  w.p2ShDt(e2.id); await sleep(20); w.p2ShDtKind('ev'); await sleep(20);
  c('予定を選ぶと時間も', !!$('#p2ShDtT') && /自分でチェック/.test($('#p2ShDtOv').textContent));
  $('#p2ShDtD').value = '2026-10-22'; $('#p2ShDtT').value = '19:00'; w.p2ShDtOk(); await sleep(40);
  c('予定に入れる：カレンダーの予定（日時）・計画シートには残る', e2.type === 'event' && e2.date === '2026-10-22' && e2.time === '19:00' && e2.endTime === '20:00' && w._p2ShActs(w._p2Ym(0), 'dist').some(x => x.id === e2.id) && /予定 19:00/.test($$('.sp-at')[1].textContent));
  w.p2ShActTg(e2.id); await sleep(20);
  c('予定は左の□を手でチェック', e2.done === true);
  w._evDeleteById(e1.id); w.renderPlan(); await sleep(30);
  c('ToDoで消したら「ToDoで消しました」と出す（戻す・外す）', !!$('.sp-at .r.gone') && /ToDoで消しました/.test($('.sp-at .r.gone').textContent) && /戻す/.test($('.sp-at .r.gone').textContent));
  w.p2ShGone(e1.id, 1); await sleep(30);
  c('戻すとまた行動に', !$('.sp-at .r.gone') && w._p2ShActs(w._p2Ym(0), 'front').some(x => x.id === e1.id));
  w._evDeleteById(e1.id); w.renderPlan(); await sleep(20); w.p2ShGone(e1.id, 0); await sleep(20);
  c('外すと計画シートから消える', !$('.sp-at .r.gone'));
  w.p2ShDt(e2.id); await sleep(20); w.p2ShDtClear(); await sleep(20);
  c('期日を消すとToDoのタスクに戻る（期日なし）', e2.type === 'task' && !e2.date && !e2.time);
});
