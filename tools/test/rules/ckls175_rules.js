// 受付 v175（スタッフが足す今日の1分: ckLes/{ユニオン}）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   読むのはだれでも1件ずつ・一覧は不可。書く・消すはオーナー・ユニオン管理者・DAYスタッフだけ（受付管理者だけの人・ほかのユニオンの DAYスタッフは不可）
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'ls-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'], dayStaff: ['day1'] });
    await setDoc(doc(d, 'checkinUnions/U2'), { name: 'U2', dayStaff: ['day2'] });
    for (const u of ['adm1', 'day1', 'day2']) await setDoc(doc(d, 'users/' + u), { union: u === 'day2' ? 'U2' : 'U1', status: 'active' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const day = env.authenticatedContext('day1').firestore(), day2 = env.authenticatedContext('day2').firestore(), adm = env.authenticatedContext('adm1').firestore();
  const L = (n) => Array.from({ length: n }, (_, i) => ({ t: 'コツ' + i, b: '本文' + i }));
  const C = (by, x) => Object.assign({ L: L(2), by, at: serverTimestamp() }, x || {});
  c('DAYスタッフは自分のユニオンの1分を足せる', await ok(setDoc(doc(day, 'ckLes/U1'), C('day1'))));
  c('だれでも1件は読める（お客さんのアプリ・ログインなし）', await ok(getDoc(doc(anon, 'ckLes/U1'))));
  c('一覧は見られない', !(await ok(getDocs(collection(anon, 'ckLes')))));
  c('ログインしていない人は書けない', !(await ok(setDoc(doc(anon, 'ckLes/U1'), C('x')))));
  c('ほかのユニオンの DAYスタッフは書けない', !(await ok(setDoc(doc(day2, 'ckLes/U1'), C('day2')))));
  c('受付管理者だけの人は書けない', !(await ok(setDoc(doc(adm, 'ckLes/U1'), C('adm1')))));
  c('足した人（by）は自分だけ', !(await ok(setDoc(doc(day, 'ckLes/U1'), C('someone')))));
  c('30こまで（31こはだめ・30こはOK）', !(await ok(setDoc(doc(day, 'ckLes/U1'), C('day1', { L: L(31) })))) && await ok(setDoc(doc(day, 'ckLes/U1'), C('day1', { L: L(30) }))));
  c('空・リストでないものはだめ', !(await ok(setDoc(doc(day, 'ckLes/U1'), C('day1', { L: [] })))) && !(await ok(setDoc(doc(day, 'ckLes/U1'), C('day1', { L: 'x' })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(day, 'ckLes/U1'), C('day1', { x: 1 })))));
  c('ほかのユニオンの DAYスタッフは消せない', !(await ok(deleteDoc(doc(day2, 'ckLes/U1')))));
  c('DAYスタッフは消せる', await ok(deleteDoc(doc(day, 'ckLes/U1'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
