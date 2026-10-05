// 主な画面をひととおり開いて、エラーが出ないか（縦・横・PC）
const T = require('../lib/head.js')({ timeout: 90000 });
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login();
  const errs = [];
  w.addEventListener('error', e => errs.push((e.message || e.error) + ''));
  const M = (id, p, title, x) => Object.assign({ id, lastName: id, firstName: '太郎', title, parentId: p, mapType: 'both', startMonth: '2020.01', ptSelf: 0 }, x || {});
  w.state.members = [M('r', '', 'BD', { activity: 'S', actRate: 100, ptSelf: 3000 }), M('a', 'r', 'B3', { activity: 'A', actRate: 80 }), M('b', 'a', 'B1'), M('t', 'r', 'PG', { trainee: true })];
  w.state.idealMembers = [];
  w.state.events = [{ id: 'e1', date: '2026-10-13', time: '19:00', title: 'CT a太郎', type: 'event', memberIds: ['a'] }, { id: 't1', date: '2026-10-14', title: 'タスク', type: 'task' }];
  try { w.recalcAllGSV(); } catch (e) {}
  const V = ['home', 'current', 'ideal', 'plan', 'stats', 'ol', 'members', 'goals', 'menu'];
  for (const [W, H, nm] of [[390, 844, '縦'], [844, 390, '横'], [1400, 900, 'PC']]) {
    setWH(W, H); try { w._uxSync(); } catch (e) {}
    for (const v of V) {
      const n = errs.length;
      try { w.switchView(v); } catch (e) { errs.push(v + ': ' + e.message); }
      await sleep(40);
      c(nm + '：' + v + ' を開ける', errs.length === n, errs.slice(n).join(' / '));
    }
    w.switchView('events');
    for (const m of ['calendar', 'week', 'day', 'agenda']) {
      const n = errs.length;
      try { w.setEventsMode(m); } catch (e) { errs.push(m + ': ' + e.message); }
      await sleep(30);
      c(nm + '：予定 ' + m, errs.length === n, errs.slice(n).join(' / '));
    }
    const n2 = errs.length;
    try { w.switchView('current'); await sleep(30); if (w.mxTap) w.mxTap('a'); await sleep(20); if (w.ppClose) w.ppClose(); w.openEditModal ? 0 : 0; } catch (e) { errs.push('member: ' + e.message); }
    c(nm + '：メンバーの画面', errs.length === n2, errs.slice(n2).join(' / '));
  }
});
