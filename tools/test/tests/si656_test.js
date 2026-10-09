// v656：シミュレーションのフロント人数を理想MAPへ／0段目に自分を自動で
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 2500 }];
  w.state.idealMembers = [];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(30);
  const cfg = w._p2SimCfg(); cfg.preset = 3; cfg.fronts = [0, 3, 3, 0]; const lm = w._p2Ym(-1); cfg.sy = +lm.slice(0, 4); cfg.sm = +lm.slice(5); // v719: 今月＝Q2の月
  w.p2SimApply(); await sleep(20);
  const I = w._idealStats(w.state.idealMembers);
  c('v775: シミュレーションは理想MAPに人を足さない（理想MAPとは連動しない）', I.newFront === 0);
  c('今月のフロント目標も3人', +w._p2M(w._p2Ym(0)).front === 3 || w._p2FrontTgt(w._p2Ym(0)) === 3);
  cfg.preset = 1; cfg.fronts = [0, 1, 1, 0]; w.p2SimApply(); await sleep(20);
  c('減らすと今月の目標も1人に', w._p2FrontTgt(w._p2Ym(0)) === 1);
  cfg.preset = 4; cfg.fronts = [0, 4, 4, 0]; w.p2SimApply(); await sleep(20);
  c('増やすと4人に（理想MAPはそのまま）', w._p2FrontTgt(w._p2Ym(0)) === 4 && w._idealStats(w.state.idealMembers || []).newFront === 0);
  console.log('=== 0段目に自分 ===');
  w.state.members = []; w.localStorage.removeItem('gm_hadRoot_' + w.currentUser.uid);
  w.currentUser.name = '山内 北斗';
  const fg = w.fsGet; w.fsGet = () => Promise.resolve(null);
  w._gmAutoSelf(w.currentUser.uid, w.state.currentMonth); await sleep(30);
  c('はじめての人は0段目にログインした人を登録', w.state.members.length === 1 && !w.state.members[0].parentId && w.state.members[0].lastName === '山内' && w.state.members[0].firstName === '北斗');
  w.state.members = []; w._gmAutoSelf(w.currentUser.uid, w.state.currentMonth); await sleep(30);
  c('一度登録したことがある人は作らない', w.state.members.length === 0);
  w.localStorage.removeItem('gm_hadRoot_' + w.currentUser.uid);
  w.fsGet = () => Promise.resolve({ members: [{ id: 'x' }] }); w._gmAutoSelf(w.currentUser.uid, w.state.currentMonth); await sleep(30);
  c('前の月にデータがある人（翌月コピー前）は作らない', w.state.members.length === 0);
  w.fsGet = fg;
});
