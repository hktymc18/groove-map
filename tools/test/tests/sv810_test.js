// v810：古い内容での上書きを防ぐ（ほかの画面が先に保存していたら上書きしない・端末の控えを読んだ時は保存しない・旧形式は新しいデータが無い月だけ移す）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const uid = w.currentUser.uid, mon = w.state.currentMonth;
  const P = { c: 'maps/' + uid + '/months/' + mon + '_current', i: 'maps/' + uid + '/months/' + mon + '_ideal', s: 'maps/' + uid + '/stats/' + mon, lg: 'maps/' + uid + '/months/' + mon };
  const R = () => ({ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' });
  let DB = {}, fromCache = false, writes = [], dels = [];
  const odoc = w.db.doc;
  w.db.doc = p => Object.assign(odoc(p), {
    get() { const d = DB[p]; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)), metadata: { fromCache }, ref: { delete() { dels.push(p); delete DB[p]; return Promise.resolve(); } } }); },
    set(d) { writes.push(p); DB[p] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); }
  });
  w.fsSet = (p, d) => w.db.doc(p).set(d);
  const load = async () => { w._fsPrefetch = {}; w.fsLoadFromFirestore(uid); await sleep(40); };
  // ① 普通に読んで保存できる
  DB[P.c] = { members: [R(), { id: 'a', lastName: '佐藤', firstName: '花', parentId: 'r', mapType: 'both' }], updatedAt: 'T1' };
  DB[P.i] = { members: [R()], updatedAt: 'T1' }; DB[P.s] = { stats: w.getDefaultStats(), commission: {}, freshData: {}, updatedAt: 'T1' };
  await load();
  c('読み込める', w.state.members.length === 2 && w._fsReady === uid + '|' + mon);
  w.state.idealMembers.push({ id: 'x', lastName: '理想', parentId: 'r' }); writes = [];
  await w.fsSaveToFirestore(uid);
  c('自分の変更は保存される', writes.indexOf(P.i) >= 0 && DB[P.i].members.length === 2);
  // ② ほかの画面が先に保存（理想MAPが別の画面で変わった）→ この画面の古い内容で上書きしない
  DB[P.i] = { members: [R(), { id: 'y', lastName: '別の画面で足した' }], updatedAt: 'OTHER' };
  w.state.idealMembers = [R()]; writes = []; let err = null;
  await w.fsSaveToFirestore(uid).catch(e => { err = e; }); await sleep(40);
  c('ほかの画面が先に保存していたら上書きしない', err && err.gmConflict && writes.indexOf(P.i) < 0 && DB[P.i].members.some(m => m.id === 'y'));
  c('最新を読み直す', w.state.idealMembers.some(m => m.id === 'y'));
  // ③ 現状MAP：空の画面のまま保存しても、サーバーのメンバーは消さない（読んだ直後1分の確認なしの上書きはやめた）
  await load(); w.state.members = []; writes = [];
  await w.fsSaveToFirestore(uid);
  c('空の画面で保存しても現状MAPのメンバーは消えない', DB[P.c].members.length === 2);
  // ④ 端末の控え（キャッシュ）を読んだ時は保存しない
  fromCache = true; await load(); fromCache = false;
  err = null; await w.fsSaveToFirestore(uid).catch(e => { err = e; });
  c('端末の控えを読んだ時は保存しない（表示だけ）', err && err.gmNotReady && w._fsCacheOnly === true);
  clearTimeout(w._fsRetryT);
  await load();
  c('サーバーから読めたら保存できる', w._fsReady === uid + '|' + mon && !w._fsCacheOnly);
  // ⑤ 旧形式：新しい形式のデータがある月は、旧形式で上書きしない（消すだけ）
  w.localStorage.removeItem('gm_legacyChk_' + uid + '_' + mon);
  DB[P.lg] = { members: [{ id: 'old', lastName: '昔の人', mapType: 'both' }] }; writes = []; dels = [];
  await load();
  c('新しいデータがある月は旧形式で上書きしない（旧形式は消す）', !writes.some(p => p === P.c) && DB[P.c].members.length === 2 && dels.indexOf(P.lg) >= 0 && !w.state.members.some(m => m.id === 'old'));
  // ⑥ 新しい形式のデータが無い月だけ移す
  w.localStorage.removeItem('gm_legacyChk_' + uid + '_' + mon);
  delete DB[P.c]; delete DB[P.i]; DB[P.lg] = { members: [{ id: 'old', lastName: '昔の人', mapType: 'both' }] };
  await load();
  c('新しいデータが無い月だけ旧形式から移す', DB[P.c] && DB[P.c].members[0].id === 'old' && w.state.members.some(m => m.id === 'old'));
});
