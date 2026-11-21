// v893：サーバーのプログラム（functions/purge.js）。オーナーが「完全に消す」を予約した削除済みのアカウントを消す
//   （にせのデータベース・にせの Authentication で試す。本物には触らない。名前はすべて架空）
const path = require('path');
const P = require(path.join(__dirname, '../../../functions/purge.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
(async () => {
  const OWNER = P.OWNERS[0], R = { req: true, by: OWNER, at: 'x' };
  // ── 消してよいか ──
  c('削除済み・オーナーの予約なら消す', P.why('d1', { deleted: true, purge: Object.assign({}, R) }, false) === '');
  c('オーナーのアカウントは消さない', /オーナー/.test(P.why(OWNER, { deleted: true, purge: Object.assign({}, R) }, false)));
  c('削除していないアカウントは消さない', /削除したアカウントではない/.test(P.why('d1', { deleted: false, purge: Object.assign({}, R) }, false)));
  c('管理者は消さない', /管理者/.test(P.why('d1', { deleted: true, role: 'admin', purge: Object.assign({}, R) }, false)));
  c('受付のアカウントもある人は消さない', /受付/.test(P.why('d1', { deleted: true, purge: Object.assign({}, R) }, true)));
  c('オーナー以外の予約では消さない', /オーナーの予約/.test(P.why('d1', { deleted: true, purge: { req: true, by: 'someone' } }, false)));
  // ── run: にせの admin ──
  const store = {
    'users/d1': { name: '見本 一', email: 'd1@example.com', deleted: true, status: 'disabled', purge: Object.assign({}, R) },
    'users/d1/fcmTokens/t1': { t: 1 },
    'maps/d1/months/2026.11_current': { members: [] },
    'ckFollow/d1': { a: 1 },
    'users/d2': { name: '見本 二', deleted: true, purge: Object.assign({}, R) },
    'checkinUsers/d2': { role: 'staff' },
    'users/d3': { name: '見本 三', deleted: false, purge: Object.assign({}, R) },
    'users/keep': { name: '見本 残す', deleted: true },
    'maps/keep/months/x': { members: [1] }
  };
  const authDel = [];
  const ref = (p) => ({
    id: p.split('/').pop(), path: p,
    get: async () => ({ exists: !!store[p], data: () => store[p] && JSON.parse(JSON.stringify(store[p])) }),
    delete: async () => { delete store[p]; },
    update: async (o) => { Object.keys(o).forEach((k) => { const ks = k.split('.'); let t = store[p]; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]] = t[ks[i]] || {}; t[ks[ks.length - 1]] = o[k]; }); }
  });
  const db = {
    doc: ref,
    recursiveDelete: async (r) => { Object.keys(store).forEach((k) => { if (k === r.path || k.indexOf(r.path + '/') === 0) delete store[k]; }); },
    collection: (n) => ({ where: (f, op, v) => ({ limit: () => ({ get: async () => ({ docs: Object.keys(store).filter((k) => k.split('/').length === 2 && k.indexOf(n + '/') === 0 && store[k].purge && store[k].purge.req === v).map((k) => ({ id: k.split('/')[1], ref: ref(k) })) }) }) }) })
  };
  const admin = { firestore: () => db, auth: () => ({ deleteUser: async (uid) => { authDel.push(uid); } }) };
  const out = await P.run(admin);
  c('予約のある3件を見る', out.length === 3, JSON.stringify(out));
  c('d1：ログインのアカウントを消す', authDel.join() === 'd1', authDel.join());
  c('d1：アカウントの情報（中の fcmTokens も）・MAP・ckFollow を消す', !store['users/d1'] && !store['users/d1/fcmTokens/t1'] && !store['maps/d1/months/2026.11_current'] && !store['ckFollow/d1']);
  c('d2：受付のアカウントがあるので消さず、理由を書いて予約を外す', !!store['users/d2'] && store['users/d2'].purge.req === false && /受付/.test(store['users/d2'].purge.err) && !!store['checkinUsers/d2']);
  c('d3：削除していないので消さず、理由を書く', !!store['users/d3'] && store['users/d3'].purge.req === false && /削除したアカウントではない/.test(store['users/d3'].purge.err));
  c('予約の無い人は触らない', !!store['users/keep'] && !!store['maps/keep/months/x']);
  // 失敗した時は理由を書いて予約を外す（次の回にまた試さない）
  store['users/d4'] = { name: '見本 四', deleted: true, purge: Object.assign({}, R) };
  const admin2 = { firestore: () => db, auth: () => ({ deleteUser: async () => { const e = new Error('permission'); e.code = 'auth/insufficient-permission'; throw e; } }) };
  const out2 = await P.run(admin2);
  c('Authentication を消せない時は、理由を書いて予約を外す（データは消さない）', out2.length === 1 && !!store['users/d4'] && store['users/d4'].purge.req === false && /消せませんでした/.test(store['users/d4'].purge.err));
  store['users/d5'] = { name: '見本 五', deleted: true, purge: Object.assign({}, R) };
  const admin3 = { firestore: () => db, auth: () => ({ deleteUser: async () => { const e = new Error('no user'); e.code = 'auth/user-not-found'; throw e; } }) };
  await P.run(admin3);
  c('ログインのアカウントがもう無い時は、データだけ消す', !store['users/d5']);
  const idx = require('fs').readFileSync(path.join(__dirname, '../../../functions/index.js'), 'utf8');
  c('overdueReminders の最後で動かす（新しい関数は作らない）', /require\('\.\/purge'\)/.test(idx) && /await purge\.run\(admin\)/.test(idx) && !/exports\.purge/.test(idx));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
