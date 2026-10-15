// v806：ユニオン名の変更前の名前（BASE ANTARES など）のまま残っていた人を、ログイン時に新しい名前へ直す
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  const writes = [];
  w.fsSet = (p, d) => { writes.push([p, d]); return Promise.resolve(); };
  const u = { uid: 'u1', name: '浦田昌矢', union: 'BASE ANTARES' };
  w._unionRenameHeal(u);
  c('BASE ANTARES → ANTARES（本人のプロフィールも書き直す）', u.union === 'ANTARES' && writes.length === 1 && writes[0][0] === 'users/u1' && writes[0][1].union === 'ANTARES', JSON.stringify(writes));
  const r = { uid: 'u2', union: 'BASE REVE' }, l = { uid: 'u3', union: 'LIEN LOAD' };
  w._unionRenameHeal(r); w._unionRenameHeal(l);
  c('BASE REVE → REVE・LIEN LOAD → LOAD', r.union === 'REVE' && l.union === 'LOAD');
  const n = writes.length, ok = { uid: 'u4', union: 'ANTARES' }, lien = { uid: 'u5', union: 'LIEN' };
  w._unionRenameHeal(ok); w._unionRenameHeal(lien); w._unionRenameHeal({ uid: 'u6' }); w._unionRenameHeal(null);
  c('新しい名前・別のユニオン（LIEN）・未設定は触らない', ok.union === 'ANTARES' && lien.union === 'LIEN' && writes.length === n);
  // ログインの流れでも直る（オフライン起動用の控えも新しい名前）
  T.login();
  try { w.loginSuccess({ uid: 'u7', name: 'テスト', union: 'BASE ANTARES', area: '福岡', upRuby: 'a', upBd: 'b', unionSelectedV2: true, status: 'active' }); } catch (e) {}
  await sleep(30);
  let snap = {}; try { snap = JSON.parse(w.localStorage.getItem('gm_lastProfile') || '{}'); } catch (e) {}
  c('ログインした人の所属も ANTARES に（控えも）', w.currentUser.union === 'ANTARES' && snap.union === 'ANTARES' && writes.some(x => x[0] === 'users/u7' && x[1].union === 'ANTARES'));
});
