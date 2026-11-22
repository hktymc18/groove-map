// NAVIGATOR v893（削除したアカウントを「完全に消す」予約 users/{uid}.purge）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'purge-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const as = u => env.authenticatedContext(u).firestore();
  const P = (un, x) => Object.assign({ name: '見本 太郎', union: un, area: '福岡', upRuby: '見本', upBd: '見本', status: 'active', role: 'member' }, x || {});
  await env.withSecurityRulesDisabled(async (cx) => {
    const f = cx.firestore();
    await setDoc(doc(f, 'appConfig/unions'), { names: ['LIEN', 'REVE'] });
    await setDoc(doc(f, 'users/' + OWNER), P('REVE'));
    await setDoc(doc(f, 'users/adm'), P('LIEN', { role: 'admin' }));
    await setDoc(doc(f, 'users/d1'), P('LIEN', { deleted: true, status: 'disabled' }));
    await setDoc(doc(f, 'users/me'), P('LIEN'));
  });
  const R = () => ({ purge: { req: true, by: OWNER, at: '2026-11-21T00:00:00Z' } });
  c('オーナーは「完全に消す」の予約を付けられる', await ok(setDoc(doc(as(OWNER), 'users/d1'), R(), { merge: true })));
  c('オーナーは予約を外せる', await ok(setDoc(doc(as(OWNER), 'users/d1'), { purge: { req: false, by: OWNER, at: 'x', cancel: true } }, { merge: true })));
  c('ユニオンの管理者は予約を付けられない（同じユニオンでも）', !(await ok(setDoc(doc(as('adm'), 'users/d1'), R(), { merge: true }))));
  c('ユニオンの管理者は、ほかの項目は今までどおり保存できる', await ok(updateDoc(doc(as('adm'), 'users/d1'), { area: '東京' })));
  c('本人は自分に予約を付けられない', !(await ok(setDoc(doc(as('me'), 'users/me'), R(), { merge: true }))));
  c('本人は、ほかの項目は今までどおり保存できる', await ok(updateDoc(doc(as('me'), 'users/me'), { area: '大阪' })));
  await env.withSecurityRulesDisabled(async (cx) => { await setDoc(doc(cx.firestore(), 'users/me'), { purge: { req: false, err: 'x' } }, { merge: true }); });
  c('本人は、付いている purge を変えずに保存できる', await ok(updateDoc(doc(as('me'), 'users/me'), { area: '京都' })));
  c('本人は purge を変えられない', !(await ok(updateDoc(doc(as('me'), 'users/me'), { 'purge.req': true }))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
