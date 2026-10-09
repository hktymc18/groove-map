// v776：サマリー（行動は入力画面と同じ一覧で✔できる・数字を押すと − ＋／予定・ToDoに入れる）・ロードマップのサマリーにやりたいこと
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 1000); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  const ym = w._p2Ym(0);
  const a1 = w._tdMakeTask('新規リストを10人出す', '', ''); a1.planYm = ym; a1.planCat = 'front';
  const a2 = w._tdMakeTask('CT取り練習', ym + '-20', ''); a2.planYm = ym; a2.planCat = 'front';
  w.state.events = [a1, a2];
  w.switchView('plan'); w.p2Go('sheet'); await sleep(30);
  w.p2SumTgl('sh', 1); await sleep(30);
  const acts = $('.sm-acts');
  c('行動は入力画面と同じ表（書いた行だけ・追加の行はない）', !!acts && $$('.sm-acts .sp-at').length === 4 && /新規リストを10人出す/.test(acts.textContent) && /CT取り練習/.test(acts.textContent) && !$('.sm-acts .addr') && !$('.sm-acts input'));
  c('期日も見える', /\d+\/20/.test(acts.textContent));
  $$('.sm-acts .sp-at')[0].querySelector('.r .c').click(); await sleep(30);
  c('サマリーから✔できる', w.state.events.some(e => e.title === '新規リストを10人出す' && e.done) || w.state.events.some(e => e.title === 'CT取り練習' && e.done));
  // 数字を押す
  const M = w._p2ShM(ym); M.kpi.ct = 8; M.man.ct = 2; w.renderPlan(); await sleep(20);
  const ctCard = $$('.sm-k').find(e => /^CT/.test(e.querySelector('.h').textContent));
  c('数字のカードに達成率', /25%/.test(ctCard.textContent));
  ctCard.click(); await sleep(10);
  c('押すと小窓（− ＋・予定に入れる・ToDoに入れる）', !!$('#p2SmKpOv .sp-st') && /予定に入れる/.test($('#p2SmKpOv').textContent) && /ToDoに入れる/.test($('#p2SmKpOv').textContent));
  $('#p2SmKpOv .sp-st i:last-child').click(); $('#p2SmKpOv .sp-st i:last-child').click(); await sleep(5);
  c('＋で数だけ増える', M.man.ct === 4 && $('#p2SmKpOv .sp-st input').value === '4' && /50%/.test($('#p2SmKpOv .sp-rt').textContent));
  const n0 = w.state.events.length;
  w.p2SmKpAdd('ct', 'ev'); await sleep(10);
  c('予定に入れる → 日にちの窓（予定）', !!$('#p2ShDtOv') && /予定に入れる/.test($('#p2ShDtOv .seg .on').textContent));
  w.document.getElementById('p2ShDtD').value = ym + '-15'; w.p2ShDtOk(); await sleep(20);
  const ne = w.state.events[w.state.events.length - 1];
  c('予定ができて、数も＋1', w.state.events.length === n0 + 1 && ne.type === 'event' && ne.date === ym + '-15' && /CT/.test(ne.title) && M.man.ct === 5);
  w.p2SmKpAdd('ct', 'todo'); await sleep(10); w.document.getElementById('p2ShDtD').value = ym + '-16'; w.p2ShDtOk(); await sleep(20);
  const nt = w.state.events[w.state.events.length - 1];
  c('ToDoにも入れられて、数も＋1', nt.type === 'task' && nt.date === ym + '-16' && M.man.ct === 6);
  c('予定・ToDoで入れた物は計画シートの行動には混ざらない', w._p2ShActs(ym).length === 2);
  w.p2SumTgl('sh', 0);
  // ロードマップのサマリーにやりたいこと・なりたい自分
  const g = w._p2G(); g.ans.want_do = ['ハワイに家族旅行', '家を建てる']; g.ans.want_be = ['みんなに頼られる人'];
  w.p2Go('year'); await sleep(30); w.p2SumTgl('yr', 1); await sleep(30);
  const wn = $('.sm-wns');
  c('ロードマップのサマリーの先頭にやりたいこと・なりたい自分', !!wn && /ハワイに家族旅行/.test(wn.textContent) && /家を建てる/.test(wn.textContent) && /みんなに頼られる人/.test(wn.textContent) && $('.sm').firstElementChild.classList.contains('sm-h'));
  w.p2SumTgl('yr', 0);
});
