// 受付 v119（準備中のユーザー機能の確認メンバー checkinConfig/beauty）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/ckbt119_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'bt-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1' });
    await setDoc(doc(d, 'checkinUnions/U2'), { name: 'U2' });
    for (const [u, un, st] of [['tst1', 'U1', 'active'], ['tst2', 'U2', 'active'], ['staff1', 'U1', 'active'], ['tstOff', 'U1', 'disabled']]) await setDoc(doc(d, 'users/' + u), { union: un, status: st });
    await setDoc(doc(d, 'checkinUsers/u100'), { uid: 'u100', name: '見本', union: 'U1', cardToken: 'tok', active: true, visits: 1 });
  });
  const owner = env.authenticatedContext(OWNER).firestore();
  const tst1 = env.authenticatedContext('tst1').firestore();
  const tst2 = env.authenticatedContext('tst2').firestore();
  const staff = env.authenticatedContext('staff1').firestore();
  const toff = env.authenticatedContext('tstOff').firestore();
  const anon = env.unauthenticatedContext().firestore();
  const T = (x) => Object.assign({ testers: ['tst1', 'tst2', 'tstOff'], by: OWNER, at: serverTimestamp() }, x);
  c('確認メンバーの一覧はだれでも読める（画面の出し分け用）', await ok(getDoc(doc(anon, 'checkinConfig/beauty'))));
  c('受付の人は確認メンバーを決められない', !(await ok(setDoc(doc(staff, 'checkinConfig/beauty'), T({ by: 'staff1' })))));
  c('オーナーは確認メンバーを決められる', await ok(setDoc(doc(owner, 'checkinConfig/beauty'), T())));
  c('by がオーナー本人でないと保存できない', !(await ok(setDoc(doc(owner, 'checkinConfig/beauty'), T({ by: 'x' })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(owner, 'checkinConfig/beauty'), T({ x: 1 })))));
  c('ほかの checkinConfig はこの形では作れない', !(await ok(setDoc(doc(owner, 'checkinConfig/other'), T()))));
  c('確認メンバーは自分のユニオンのユーザーを見られる', await ok(getDoc(doc(tst1, 'checkinUsers/u100'))));
  c('確認メンバーは自分のユニオンのユーザーの一覧を見られる', await ok(getDocs(query(collection(tst1, 'checkinUsers'), where('union', '==', 'U1')))));
  c('確認メンバーでも、ほかのユニオンのユーザーは見られない', !(await ok(getDoc(doc(tst2, 'checkinUsers/u100')))));
  c('確認メンバーでない受付の人は見られない（今まで通り）', !(await ok(getDoc(doc(staff, 'checkinUsers/u100')))));
  c('無効のアカウントは確認メンバーでも見られない', !(await ok(getDoc(doc(toff, 'checkinUsers/u100')))));
  c('確認メンバーは名前を直せる', await ok(setDoc(doc(tst1, 'checkinUsers/u100'), { name: '見本 はな' }, { merge: true })));
  c('確認メンバーでもユニオンは変えられない', !(await ok(setDoc(doc(tst1, 'checkinUsers/u100'), { union: 'U2' }, { merge: true }))));
  c('確認メンバーでない受付の人は名前を直せない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { name: 'x' }, { merge: true }))));
  c('確認メンバーは消せる', await ok(deleteDoc(doc(tst1, 'checkinUsers/u100'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
