// v912：予定から PLAN に数える機能をなくす（11月から。10月までの数は記録として残す）。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-22T03:00:00Z' });
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'B5', parentId: '', mapType: 'both', activity: 'S' },
    { id: 'n1', lastName: '見本', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both', activity: 'A' }];
  w.state.events = [
    { id: 'e1', title: 'ゆき、りさこ CT', date: '2026-11-20', time: '10:00', type: 'event', memberIds: ['n1'], memberId: 'n1' },
    { id: 'e2', title: 'FT', date: '2026-11-21', time: '10:00', type: 'event', memberIds: ['n1'], memberId: 'n1' },
    { id: 'e3', title: 'ST', date: '2026-11-22', time: '01:00', type: 'event', memberIds: [] },
    { id: 'e4', title: 'CT取り', date: '2026-11-23', time: '21:00', type: 'event', memberIds: [] },
    { id: 'eO', title: 'FT', date: '2026-10-05', time: '10:00', type: 'event', memberIds: ['n1'], memberId: 'n1' }];
  const ym = '2026-11';
  c('11月の予定は CT・FT・ST・CT取り とも数えない', ['ct', 'ft', 'st', 'ctget'].every(k => w._p2ActAuto(ym, k) === 0));
  c('今週の予定の枠にも出さない（_p2KindEvs が空）', ['ct', 'ft', 'st', 'ctget'].every(k => w._p2KindEvs(k, '2026-11-01', '2026-11-30').length === 0) && w._p2CtGotEvs('2026-11-01', '2026-11-30').length === 0);
  c('10月の数は記録として残す', w._p2ActAuto('2026-10', 'ft') === 1);
  // 予定の画面のヒント
  const d = w.document.createElement('div'); d.id = 'evLinkHint'; w.document.body.appendChild(d);
  const ti = w.document.createElement('input'); ti.id = 'evTitle'; ti.value = 'ゆき、りさこ、広介CT'; w.document.body.appendChild(ti);
  w.evLinkHintRender();
  c('予定の画面に「PLAN「CT」に数えます」を出さない', !/PLAN「/.test(d.textContent) && !/に数えます/.test(d.textContent), d.textContent);
  // 予定を済みにしても PLAN に足さない
  const before = JSON.stringify((w.state.goals && w.state.goals.plan && w.state.goals.plan.dailyActuals) || {});
  const ev = { id: 'eT', title: 'CT', date: '2026-11-22', type: 'task', templateStage: 'ct', done: true };
  w._evRewardOnDone(ev);
  const after = JSON.stringify((w.state.goals && w.state.goals.plan && w.state.goals.plan.dailyActuals) || {});
  c('テンプレートの予定を済みにしても PLAN の数は増えない（XPだけ）', before === after && ev.rewarded === true);
});
