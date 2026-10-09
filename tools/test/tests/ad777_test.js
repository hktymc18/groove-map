// v777：アカウント管理・承認待ち・ランキングは自分のユニオンの人だけを読み込む（オーナーは全体）
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
const fs = require('fs'), p = require('path'), R = p.join(__dirname, '../../..');
T.run(async () => {
  T.login();
  const ALL = [{ id: 'a', name: '同じ 一', union: 'GRANT', status: 'active' }, { id: 'b', name: '同じ 二', union: 'GRANT', status: 'pending' }, { id: 'x', name: '他 三', union: 'LIEN', status: 'pending' }];
  const qs = [];
  const mkQ = (filters) => ({
    where(f, op, v) { return mkQ(filters.concat([[f, v]])); },
    get() { qs.push(filters); const L = ALL.filter(u => filters.every(([f, v]) => u[f] === v)); return Promise.resolve({ empty: !L.length, forEach(fn) { L.forEach(u => fn({ id: u.id, data: () => Object.assign({}, u) })); } }); },
  });
  const coll0 = w.db.collection;
  w.db = Object.assign({}, w.db, { collection(path) { return path === 'users' ? mkQ([]) : coll0(path); } });
  let fullRead = 0; const fg = w.fsGetCol; w.fsGetCol = (path) => { if (path === 'users') { fullRead++; return Promise.resolve(ALL.map(u => Object.assign({}, u))); } return fg(path); };
  // ユニオン管理者
  w.currentUser = { uid: 'adm', name: '管理者', union: 'GRANT', role: 'admin' };
  w.loadAdminUsers(); await sleep(30);
  c('ユニオン管理者は自分のユニオンだけ読み込む（全員を読まない）', fullRead === 0 && qs.some(q => q.length === 1 && q[0][0] === 'union' && q[0][1] === 'GRANT') && w._adminUsers.every(u => u.union === 'GRANT') && w._adminUsers.length === 2);
  qs.length = 0; w.checkPendingApprovals(); await sleep(20);
  c('承認待ちの件数も自分のユニオンだけ', qs.length === 1 && qs[0].some(f => f[0] === 'union' && f[1] === 'GRANT') && qs[0].some(f => f[0] === 'status'));
  qs.length = 0; w._rankFetchCache = null; let rows = null; w.gameFetchRanking(r => { rows = r; }); await sleep(20);
  c('ランキングも自分のユニオンだけ', qs.length === 1 && qs[0][0][1] === 'GRANT' && rows && rows.length === 2 && !rows.some(r => r.uid === 'x'));
  w.currentUser = { uid: 'adm2', name: '空', union: '', role: 'admin' }; w._adminUsers = ALL; 
  c('ユニオンが空の管理者には誰も出さない', w._adminScopedUsers().length === 0);
  // オーナーは全体
  w.currentUser = { uid: T.OWNER, name: 'オーナー', union: 'GRANT' };
  w.loadAdminUsers(); await sleep(30);
  c('オーナーは全ユニオン', fullRead === 1 && w._adminUsers.length === 3);
  const rules = fs.readFileSync(R + '/firestore.rules', 'utf8');
  c('ルール：アカウントの削除はオーナー／同じユニオンの管理者だけ', /allow delete: if isOwnerAdmin\(\) \|\| \(isUnionAdmin\(\) && sameUnionAsTarget\(\)\);/.test(rules));
  c('ルール：同意の履歴は本人・オーナー・同じユニオンの管理者だけ', /match \/consents\/\{ver\}[\s\S]{0,400}isOwnerAdmin\(\) \|\| \(isUnionAdmin\(\)/.test(rules));
});
