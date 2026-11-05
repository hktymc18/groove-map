// v866：読み取りを減らす。予定・ユニオンの予定はサーバーから読んで一定時間は端末の控えから／未完了タスクの代わりの読み方を狭く／
//   研修の取り込みは読めなかった日も1日1回／ユニオンの一覧は1日覚える／通知の登録は同じトークンなら1日1回（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const log = [];
  const qs = L => ({ empty: !L.length, size: L.length, forEach: f => L.forEach(r => f({ id: r.id, data: () => Object.assign({}, r) })) });
  let cacheHas = true, idxOk = true;
  const mk = (path, filters) => ({
    where: (f, op, v) => mk(path, filters.concat([f + op + JSON.stringify(v)])),
    get: (o) => {
      const src = o && o.source === 'cache' ? 'cache' : 'server';
      log.push(src + ':' + path + ':' + filters.join('&'));
      if (!idxOk && filters.length === 3 && src === 'server') return Promise.reject(new Error('index'));
      const L = src === 'cache' && !cacheHas ? [] : [{ id: 'e' + filters.length, date: '2026-01-01', type: 'task', done: false }];
      return Promise.resolve(qs(L));
    }
  });
  w.db.collection = p => mk(p, []);
  const server = () => log.filter(x => /^server:/.test(x)).length, cache = () => log.filter(x => /^cache:/.test(x)).length;
  w.localStorage.removeItem('gm_rd_ev_U1');
  await w._evFetchRecent('U1');
  c('はじめはサーバーから（予定・古い未完了タスク・ゴミ箱の3つ）', server() === 3 && cache() === 0, log.join(' | '));
  log.length = 0;
  await w._evFetchRecent('U1');
  c('10分以内にもう一度開いたら、端末の控えから（サーバーは0回）', server() === 0 && cache() === 3, log.join(' | '));
  log.length = 0; cacheHas = false;
  await w._evFetchRecent('U1');
  c('控えが空なら、サーバーから読み直す', server() === 3, log.join(' | '));
  cacheHas = true; log.length = 0;
  w.localStorage.setItem('gm_rd_ev_U1', String(w.Date.now() - 11 * 60000));
  await w._evFetchRecent('U1');
  c('10分たったらサーバーから', server() === 3);
  // 索引が無い時の代わりの読み方
  log.length = 0; idxOk = false; w.localStorage.removeItem('gm_rd_ev_U1'); w.localStorage.removeItem('gm_evNoIdx');
  await w._evFetchRecent('U1'); await sleep(10);
  c('索引が無い時は「タスク・未完了」で読む（前は未完了の全部）', log.some(x => /server:.*events:type=="task"&done==false$/.test(x)) && !log.some(x => /events:done==false$/.test(x)), log.join(' | '));
  c('索引が無いことを今日は覚える', w.localStorage.getItem('gm_evNoIdx') === w.evTodayYmd());
  log.length = 0; w.localStorage.removeItem('gm_rd_ev_U1');
  await w._evFetchRecent('U1');
  c('覚えている日は、失敗する読み方をしない', !log.some(x => /&date</.test(x)), log.join(' | '));
  idxOk = true;
  // ユニオンの一覧の端末の控え
  let unionsReads = 0;
  w.db.collection = p => p === 'checkinUnions' ? { get: () => { unionsReads++; return Promise.resolve(qs([{ id: 'UA', area: '' }])); } } : mk(p, []);
  w.localStorage.removeItem('gm_ckUnions');
  await w._ckUnionsList(); await w._ckUnionsList();
  c('受付のユニオンの一覧は1日覚える（2回目は読まない）', unionsReads === 1);
  await w._ckUnionsList(true);
  c('force の時は読み直す', unionsReads === 2);
  // 研修の取り込み：読めなかった日も確認済みに
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'ゴールド', parentId: '', mapType: 'both' }];
  w.currentUser.union = 'UA'; w.localStorage.removeItem('gm_ckTr_' + w.currentUser.uid);
  w.db.collection = p => p === 'checkinUnions' ? { get: () => Promise.resolve(qs([{ id: 'UA' }])) } : { where: () => ({ get: () => Promise.reject(new Error('permission-denied')) }) };
  w._ckTrBusy = false; w.ckTrAuto(); await sleep(40);
  c('研修の取り込み：読めなかった日も「今日は確認済み」（MAPを開くたびに読み直さない）', w.localStorage.getItem('gm_ckTr_' + w.currentUser.uid) === w.evTodayYmd());
  // ATTACK LIST の人数は、まとめ（appData/alSummary）を1件読むだけ
  let peopleReads = 0, sumReads = 0, sumDoc = { n: 12, apo: 3, total: 40, at: w.Date.now() - 3600000 };
  w.db.collection = p => ({ get: () => { if (/people$/.test(p)) peopleReads++; return Promise.resolve(qs([])); }, where: () => ({ get: () => Promise.resolve(qs([])) }) });
  w.db.doc = p => ({ get: () => { if (/appData\/alSummary$/.test(p)) sumReads++; return Promise.resolve({ exists: !!sumDoc, data: () => sumDoc }); }, set: () => Promise.resolve() });
  w.localStorage.removeItem(w._p2AlLsKey()); w._p2Al = { n: null, apo: null, at: 0, err: false, busy: false };
  w._p2AlLoad(true); await sleep(30);
  c('ATTACK LIST の人数：まとめがあれば1件読むだけ（リストの全員は読まない）', sumReads === 1 && peopleReads === 0 && w._p2Al.n === 12 && w._p2Al.apo === 3, JSON.stringify(w._p2Al));
  sumDoc = null; w._p2Al.busy = false;
  w._p2AlLoad(true); await sleep(30);
  c('まとめがまだ無い人は今までどおり（全員を読む）', peopleReads === 1 && w._p2Al.n === 0);
  // 通知の登録
  const H = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  c('通知の登録：同じトークン・今日登録済みなら書き込み・読み取りしない', /_oldTok === tok && localStorage\.getItem\('gm_fcmRegDay'\) === evTodayYmd\(\) \+ '\|' \+ currentUser\.uid/.test(H) && /localStorage\.setItem\('gm_fcmRegDay'/.test(H));
  c('ユニオンの予定も30分は端末の控えから', /var rk = 'un_' \+ u0, c = _rdFresh\(rk, 30 \* 60000\)/.test(H));
  c('ATTACK LIST の人数は24時間覚える', /Date\.now\(\) - c0\.at < 86400000/.test(H));
});
