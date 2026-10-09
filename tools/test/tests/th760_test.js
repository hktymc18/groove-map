// v760：研修ステップの記録を🗑で消せる（↩ 元に戻す）・記録を追加の日付とAさんは同じ大きさで並ぶ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '稲盛', firstName: '悠', title: 'PG', trainee: true, parentId: 'r', mapType: 'both', traineeHistory: [{ status: 'マケ', date: '2026-10-08', aSan: '山内', result: 'next' }, { status: 'PG', date: '2026-10-08', aSan: '山内', result: 'next' }] }];
  w.switchView('current'); await sleep(10);
  w._meOpen('a'); await sleep(20); try { w.meGo(2); } catch (e) {} await sleep(150);
  const m = w.state.members[1];
  const dels = $$('#traineeHistoryWrap .th-del');
  c('記録ごとに🗑', dels.length === 2 && !!dels[0].querySelector('svg'));
  dels[1].click(); await sleep(10);
  c('🗑で消える（PGの記録）', m.traineeHistory.length === 1 && m.traineeHistory[0].status === 'マケ' && $$('#traineeHistoryWrap .th-del').length === 1);
  w._gmUndoFn(); await sleep(10);
  c('↩ 元に戻す', m.traineeHistory.length === 2 && m.traineeHistory.some(h => h.status === 'PG'));
  w.selectStep('DLR'); await sleep(10);
  c('記録を追加：日付とAさんは同じ枠（2列のグリッド）', !!$('.thf-grid #fHistoryDate') && !!$('.thf-grid #fHistoryASan'));
});
