// NAVIGATOR v925（🤖 Claude の見立て fbTriage/{id}）の firestore.rules を、エミュレータで試す（架空のデータだけ）
//   オーナーは読める・オーナー以外（共同管理者・バグ報告の指定メンバー・ログインなし）は読めない・だれも書けない
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, updateDoc, deleteDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2', OWNER2 = 'E4WT7EHai5c6WANUgASz42Euu1y1';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'fbtriage-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const as = u => env.authenticatedContext(u).firestore();
  const P = (x) => Object.assign({ name: '見本 太郎', union: 'LIEN', status: 'active', role: 'member' }, x || {});
  await env.withSecurityRulesDisabled(async (cx) => {
    const f = cx.firestore();
    await setDoc(doc(f, 'users/' + OWNER), P());
    await setDoc(doc(f, 'users/' + OWNER2), P());
    await setDoc(doc(f, 'users/adm'), P({ role: 'admin' }));
    await setDoc(doc(f, 'users/mem'), P());
    await setDoc(doc(f, 'fbConfig/main'), { members: ['mem'], names: { mem: '見本 太郎' } });
    await setDoc(doc(f, 'fbItems/1'), { no: 1, status: 'new', title: '架空' });
    await setDoc(doc(f, 'fbTriage/1'), { verdict: 'bug', summary: '架空の見立て', confidence: 'high' });
  });
  const T = (db) => doc(db, 'fbTriage/1');
  c('オーナーは見立てを読める', await ok(getDoc(T(as(OWNER)))));
  c('もう一人のオーナーも読める', await ok(getDoc(T(as(OWNER2)))));
  c('共同管理者（role=admin）は読めない', !(await ok(getDoc(T(as('adm'))))));
  c('バグ報告の指定メンバーは読めない（fbItems は読める）', !(await ok(getDoc(T(as('mem'))))) && await ok(getDoc(doc(as('mem'), 'fbItems/1'))));
  c('ログインなしは読めない', !(await ok(getDoc(T(env.unauthenticatedContext().firestore())))));
  const W = { verdict: 'no', summary: 'x', confidence: 'low' };
  c('オーナーも新しく書けない', !(await ok(setDoc(doc(as(OWNER), 'fbTriage/2'), W))));
  c('オーナーも書き換えられない', !(await ok(updateDoc(T(as(OWNER)), { verdict: 'no' }))));
  c('オーナーも消せない', !(await ok(deleteDoc(T(as(OWNER))))));
  c('共同管理者も書けない', !(await ok(setDoc(doc(as('adm'), 'fbTriage/1'), W))));
  c('指定メンバーも書けない', !(await ok(setDoc(doc(as('mem'), 'fbTriage/1'), W))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
