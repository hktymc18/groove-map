// v711：PCのホーム（今月の帯＋3列：今日｜今週と今月の行動｜人）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900); w._uxSync && w._uxSync(); await sleep(20);
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both', ptCurrent: 3000 }];
  const t = w.evTodayYmd(), ym = w._p2Ym(0);
  const T1 = w._tdMakeTask('井上さんに連絡', t, ''); w.state.events.push(T1);
  const A1 = w._tdMakeTask('新規リストを10人出す', '', ''); A1.planYm = ym; A1.planCat = 'front'; w.state.events.push(A1);
  w.state.events.push({ id: 'ev1', date: t, time: '10:00', title: 'CT 佐藤さん', type: 'event', memberIds: [] });
  w.switchView('home'); await sleep(40);
  c('今月の帯（計画シートと同じ数字・押すと計画シート）', !!$('.ph-mon') && /の目標/.test($('.ph-mon').textContent) && /p2Go\('sheet'\)/.test($('.ph-mon').getAttribute('onclick')));
  c('3列：今日｜今週と今月の行動｜人', $$('.ph-g > *').length === 3 && /今日の予定/.test($$('.ph-c')[0].textContent) && /今週やること/.test($$('.ph-c')[1].textContent) && /気になる人/.test($$('.ph-c')[2].textContent));
  c('今日の予定とToDo', /CT 佐藤さん/.test($$('.ph-c')[0].textContent) && /井上さんに連絡/.test($$('.ph-c')[0].textContent));
  c('今月の行動（計画シートの行動・分野の札）', /新規リストを10人出す/.test($$('.ph-c')[1].textContent) && !!$$('.ph-c')[1].querySelector('.tg'));
  w.phDone(T1.id); await sleep(20);
  c('ホームでチェックできる', T1.done === true && !!$('.ph-td.dn'));
  $('#phAdd').value = 'DLRの準備'; w.phAddTodo(); await sleep(20);
  c('ホームで今日のToDoを足せる', w.state.events.some(e => e.title === 'DLRの準備' && e.date === t && e.type === 'task'));
  c('古いカード（気になるメンバー・今日のタスク）は出さない・インサイトはたたむ', !$('.home-wrap') && !!$('.ph details.ph-ins') && !$('.ph details.ph-ins').open);
  $('.ph-ins').open = true; await sleep(10);
  c('v712: インサイトはカード（コーチ・先週からの組織・今日の気づき・先月からの変化）', $$('.ph-ins .ph-ic').length === 4 && !!$('.ph-ins #homeChanges') && /コーチ/.test($('.ph-ins').textContent));
});
