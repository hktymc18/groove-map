// v691：ロードマップを1画面に（月を縦に並べた表に、数字とマイルストーンをその場で書く）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.state.members = [{ id: 'r', lastName: '山内', title: 'ゴールド', parentId: '' }];
  w.switchView('plan'); await sleep(40);
  const p = w.state.goals.plan; p.income = 3410000; p.title = 'チームエリート'; p.deadline = w._p2YmAdd(w._p2Ym(0), 14);
  w.p2Go('rm'); await sleep(20);
  const cur = w._p2Ym(0), nx = w._p2YmAdd(cur, 1);
  c('1画面の表（月が縦・項目が横）', !!$('.rm1') && $$('.rm1 tr:not(.ms)').length >= 13 && /フロント/.test($('.rm1 tr').textContent) && /流通/.test($('.rm1 tr').textContent));
  c('期日の月まで並ぶ（最終目標の印）', $$('.rm1-ms .mk').some(x => /TEAM ELITE/.test(x.textContent)));
  const fi = $$('.rm1 tr:not(.ms)')[2].querySelector('.sp-in'); fi.value = '3'; fi.onchange(); await sleep(10);
  c('フロントをその場で書く（月の目標と同じ数字）', +w._p2FrontTgt(nx) === 3);
  w.p2RmEd(nx); await sleep(10);
  $('#p2RmMsIn').value = 'EMERALD'; w.p2RmEdSave(); await sleep(10);
  const ms = w._p2Rm().ms.filter(m => m.ym === nx);
  c('マイルストーンをその場で足す', ms.length === 1 && ms[0].t === 'EMERALD' && /EMERALD/.test($('.rm1').textContent));
  w.p2RmEd(nx, ms[0].id); await sleep(10); $('#p2RmMsIn').value = 'EMERALD達成'; w.p2RmEdSave(); await sleep(10);
  c('押して名前を直す', w._p2Rm().ms.filter(m => m.ym === nx)[0].t === 'EMERALD達成');
  c('ページ送りなし・月の画面へ飛ばない', !$('.p2r-scroll') && w._p2Pg === 'rm');
});
