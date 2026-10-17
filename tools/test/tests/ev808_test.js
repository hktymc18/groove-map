// v808：予定・タスクは「直近120日〜これから」＋古い未完了タスク＋ゴミ箱だけ読む。古い分は使う時に1回だけまとめて読む
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const d = n => w.evYmd(new Date(Date.now() + n * 86400000));
  const ALL = [
    { id: 'n1', type: 'event', title: '最近の予定', date: d(-10), done: false },
    { id: 'n2', type: 'task', title: 'これからのタスク', date: d(5), done: false },
    { id: 'o1', type: 'task', title: '古い期限切れタスク', date: d(-300), done: false },
    { id: 'o2', type: 'task', title: '期限なしタスク', date: '', done: false },
    { id: 'o3', type: 'event', title: '古い予定', date: d(-200), done: false },
    { id: 'o4', type: 'task', title: '古い完了タスク', date: d(-250), done: true },
    { id: 't1', type: 'task', title: 'ゴミ箱', date: d(-400), done: false, deleted: true, deletedAt: new Date().toISOString() }];
  const log = [];
  const match = (e, fs) => fs.every(([f, op, v]) => op === '==' ? e[f] === v : op === '>=' ? (e[f] || '') >= v : op === '<' ? (e[f] || '') < v : true);
  const q = (p, fs) => ({
    where(f, op, v) { return q(p, fs.concat([[f, op, v]])); },
    get() { log.push(p + ' ' + fs.map(x => x.join('')).join('&')); const L = /\/events$/.test(p) ? ALL.filter(e => match(e, fs)) : []; return Promise.resolve({ forEach(f) { L.forEach(e => f({ id: e.id, data: () => Object.assign({}, e) })); }, docs: L.map(e => ({ id: e.id, data: () => e })) }); },
    doc: id => w.db.doc(p + '/' + id)
  });
  w.db.collection = p => q(p, []);
  const uid = w.currentUser.uid;
  await w.loadEvents(uid); await sleep(20);
  const ids = () => w.state.events.map(e => e.id).sort().join(',');
  c('全部は読まない（日付で絞った3つの読み方だけ）', !log.some(x => /\/events $/.test(x)) && log.filter(x => /\/events /.test(x)).length === 3, log.join(' | '));
  c('直近・これから・古い未完了タスク・期限なしタスクは入る', ids() === 'n1,n2,o1,o2', ids());
  c('ゴミ箱も入る', w.state.trashEvents.length === 1 && w.state.trashEvents[0].id === 't1');
  c('古い予定・古い完了タスクは最初は読まない', !w.state.events.some(e => e.id === 'o3' || e.id === 'o4'));
  // 古い分は使う時に1回だけ
  log.length = 0;
  w.renderCalendar && (w._calYear = new Date().getFullYear(), w._calMonth = new Date().getMonth());
  w._evMaybeOlder(d(-5)); await sleep(10);
  c('直近の日付では古い分を読まない', log.length === 0);
  w._evMaybeOlder(d(-200)); await sleep(30);
  c('前の月を見ると古い分をまとめて読む', log.some(x => /\/events $/.test(x)) && w.state.events.some(e => e.id === 'o3') && w.state.events.some(e => e.id === 'o4'));
  c('二重にならない', w.state.events.filter(e => e.id === 'o1').length === 1 && w.state.trashEvents.length === 1);
  log.length = 0; w._evEnsureOlder(); w.todoNavTo('smart', 'done'); await sleep(20);
  c('一度読んだらもう読まない', log.length === 0);
  // 開き直す（読み直し）と、また直近だけから
  await w.loadEvents(uid); await sleep(20);
  c('読み直すと直近だけに戻る', ids() === 'n1,n2,o1,o2' && w._evOlder.st === '');
  // インデックスがまだ無い時（古い未完了タスクの読み方が失敗）も動く
  w.db.collection = p => { const o = q(p, []); const ow = o.where; o.where = function(f, op, v) { const r = ow.call(this, f, op, v); if (f === 'type') { const r2 = r.where.bind(r); r.where = (a, b, cc) => { const r3 = r2(a, b, cc); const r4 = r3.where.bind(r3); r3.where = (x, y, z) => { const r5 = r4(x, y, z); r5.get = () => Promise.reject(new Error('index')); return r5; }; return r3; }; } return r; }; return o; };
  await w.loadEvents(uid); await sleep(20);
  c('インデックスが無い間も古い未完了タスクは入る', ids() === 'n1,n2,o1,o2', ids());
});
