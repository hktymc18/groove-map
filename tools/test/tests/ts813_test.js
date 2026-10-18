// v813（#18）：カレンダーで研修ステップ（PGなど）の予定を作って共有メンバーのNA（研修生）を選ぶと、持ち主のMAPのその人の研修履歴にも「予定」で入る
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const me = w.currentUser.uid, OU = 'abcdef999', mon = w.state.currentMonth, path = 'maps/' + OU + '/months/' + mon + '_current';
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'BR', parentId: '', mapType: 'both' }];
  w.state.mergedMaps = [{ uid: OU, graftId: 'r', name: '試験' }];
  const owner = () => [{ id: 's1', lastName: '試験', firstName: '二郎', title: 'BR', parentId: '' }, { id: 's2', lastName: '見本', firstName: '三郎', title: 'マケ', parentId: 's1', traineeHistory: [{ status: 'マケ', date: '2026-10-01', aSan: '試験', result: 'next' }] }, { id: 's3', lastName: '例題', firstName: '四郎', title: 'B3', parentId: 's1' }];
  w.state.mergedData = { [OU]: owner() };
  const DB = { [path]: { members: owner(), updatedAt: 'T0' } };
  let perm = 'edit', writes = 0;
  w._olPermCache = {};
  const fg = w.fsGet;
  w.fsGet = p => p === 'maps/' + OU + '/shared/' + me ? Promise.resolve({ perm }) : fg(p);
  const odoc = w.db.doc;
  w.db.doc = p => p === path ? { get() { const d = DB[p]; return Promise.resolve({ exists: !!d, data: () => JSON.parse(JSON.stringify(d)), metadata: {} }); }, set(d, o) { writes++; DB[p] = Object.assign({}, o && o.merge ? DB[p] : {}, JSON.parse(JSON.stringify(d))); return Promise.resolve(); } } : odoc(p);
  w.fsSet = () => Promise.resolve();
  const hist = id => (DB[path].members.filter(m => m.id === id)[0].traineeHistory || []);
  const ev = { id: 'e1', type: 'event', title: 'PG', date: '2026-10-25', memberIds: ['MG_abcdef_s2', 'MG_abcdef_s3'] };
  w.state.events = [ev];
  w.saveEventDoc(ev); await sleep(60);
  const h = hist('s2').filter(x => x.extEv === 'e1')[0];
  c('共有メンバーの研修生（NA）の研修履歴に「PG」を予定で入れる', h && h.status === 'PG' && h.date === '2026-10-25' && h.result === 'planned' && h.ext.uid === me);
  c('研修生でない人には入れない', !hist('s3').some(x => x.extEv === 'e1'));
  c('前からの記録はそのまま', hist('s2').some(x => x.status === 'マケ' && x.result === 'next'));
  c('持ち主の保存で消されないよう、その人の更新時刻を新しく', /^20\d\d-/.test(DB[path].members.filter(m => m.id === 's2')[0].updatedAt || '') && DB[path].updatedAt !== 'T0');
  c('自分の画面の共有メンバーにもすぐ反映', (w.state.mergedData[OU].filter(m => m.id === 's2')[0].traineeHistory || []).some(x => x.extEv === 'e1'));
  c('予定に「どこに入れたか」を残す', JSON.stringify(ev.tsExt) === JSON.stringify([OU]));
  // 日付を変える
  ev.date = '2026-10-27'; w.saveEventDoc(ev); await sleep(60);
  c('日付を変えると研修履歴の予定も変わる（増えない）', hist('s2').filter(x => x.extEv === 'e1').length === 1 && hist('s2').filter(x => x.extEv === 'e1')[0].date === '2026-10-27');
  // 結果を入れた後は触らない
  DB[path].members.filter(m => m.id === 's2')[0].traineeHistory.filter(x => x.extEv === 'e1')[0].result = 'next';
  ev.date = '2026-10-28'; w.saveEventDoc(ev); await sleep(60);
  c('結果（進んだ）を入れた記録は変えない', hist('s2').filter(x => x.extEv === 'e1')[0].date === '2026-10-27');
  DB[path].members.filter(m => m.id === 's2')[0].traineeHistory.filter(x => x.extEv === 'e1')[0].result = 'planned';
  // メンバーを外す
  ev.memberIds = ['MG_abcdef_s3']; w.saveEventDoc(ev); await sleep(60);
  c('関連メンバーから外すと予定の記録だけ消える', !hist('s2').some(x => x.extEv === 'e1') && hist('s2').length === 1);
  // 消す
  ev.memberIds = ['MG_abcdef_s2']; w.saveEventDoc(ev); await sleep(60);
  c('もう一度選ぶと入る', hist('s2').some(x => x.extEv === 'e1'));
  ev.deleted = true; w.saveEventDoc(ev); await sleep(60);
  c('予定を消すと研修履歴の予定も消える', !hist('s2').some(x => x.extEv === 'e1'));
  // 閲覧のみの共有
  delete ev.deleted; w._olPermCache = {}; perm = 'view'; writes = 0; let msg = '';
  const ot = w.toast; w.toast = m => { msg = m; };
  w.saveEventDoc(ev); await sleep(60);
  c('閲覧のみの共有では書き込まず、そう知らせる', writes === 0 && /閲覧のみ/.test(msg));
  w.toast = ot;
  // 研修ステップでない予定は何もしない
  w._olPermCache = {}; perm = 'edit'; writes = 0;
  const ev2 = { id: 'e2', type: 'event', title: '食事', date: '2026-10-25', memberIds: ['MG_abcdef_s2'] };
  w.saveEventDoc(ev2); await sleep(60);
  c('研修ステップでない予定は持ち主のMAPに書き込まない', writes === 0 && !ev2.tsExt);
  w.fsGet = fg;
});
