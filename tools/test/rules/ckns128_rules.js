// 受付 v128（ユーザーのカードの「お知らせ」: ckNotice/{ユニオン}）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// v139: 書けるのはオーナー・ユニオン管理者・DAYスタッフだけ（受付管理者・確認メンバーだけの人は不可）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'ns-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'], unionAdmins: ['ua1'], dayStaff: ['day1'] });
    await setDoc(doc(d, 'checkinUnions/U2'), { name: 'U2' });
    await setDoc(doc(d, 'users/adm1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/tst1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/ua1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/day1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'checkinConfig/beauty'), { testers: ['tst1'] });
    await setDoc(doc(d, 'ckNotice/U2'), { items: [{ t: '見本', d: '2026-12-01' }], by: 'x' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const as = u => env.authenticatedContext(u).firestore();
  const N = (by, x) => Object.assign({ items: [{ t: '12月のDAYは、14時からの開始です。', d: '2026-12-01' }], by: by, at: serverTimestamp() }, x);
  c('v139: 受付管理者だけの人は出せない', !(await ok(setDoc(doc(as('adm1'), 'ckNotice/U1'), N('adm1')))));
  c('v139: 確認メンバーだけの人は出せない', !(await ok(setDoc(doc(as('tst1'), 'ckNotice/U1'), N('tst1')))));
  c('ユニオン管理者は出せる', await ok(setDoc(doc(as('ua1'), 'ckNotice/U1'), N('ua1'))));
  c('DAYスタッフは、自分のユニオンのお知らせを出せる', await ok(setDoc(doc(as('day1'), 'ckNotice/U1'), N('day1'))));
  c('DAYスタッフでも、ほかのユニオンのお知らせは出せない', !(await ok(setDoc(doc(as('day1'), 'ckNotice/U2'), N('day1')))));
  c('ふつうの受付の人は出せない', !(await ok(setDoc(doc(as('staff1'), 'ckNotice/U1'), N('staff1')))));
  c('ログインしていない人は出せない', !(await ok(setDoc(doc(anon, 'ckNotice/U1'), N('x')))));
  c('ほかの人の名前（by）では出せない', !(await ok(setDoc(doc(as('day1'), 'ckNotice/U1'), N('ua1')))));
  c('6件以上は入れられない', !(await ok(setDoc(doc(as('day1'), 'ckNotice/U1'), N('day1', { items: [1, 2, 3, 4, 5, 6].map(i => ({ t: 'x' + i, d: '2026-12-01' })) })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(as('day1'), 'ckNotice/U1'), N('day1', { link: 'https://example.com' })))));
  c('カード（ログインなし）からお知らせを1件ずつ読める', await ok(getDoc(doc(anon, 'ckNotice/U1'))));
  c('お知らせの一覧は見られない', !(await ok(getDocs(collection(anon, 'ckNotice')))));
  c('受付管理者・確認メンバーだけの人は消せない', !(await ok(deleteDoc(doc(as('tst1'), 'ckNotice/U1')))) && !(await ok(deleteDoc(doc(as('adm1'), 'ckNotice/U1')))));
  c('DAYスタッフは消せる', await ok(deleteDoc(doc(as('day1'), 'ckNotice/U1'))));
  // DAYスタッフ（checkinUnions/{un}.dayStaff）を決められる人
  const DS = (u, arr) => setDoc(doc(as(u), 'checkinUnions/U1'), { dayStaff: arr }, { merge: true });
  c('受付管理者は DAYスタッフを決められない', !(await ok(DS('adm1', ['adm1']))));
  c('DAYスタッフ本人は DAYスタッフを決められない（ほかの人を足せない）', !(await ok(DS('day1', ['day1', 'staff1']))));
  c('ふつうの人は自分を DAYスタッフにできない', !(await ok(DS('staff1', ['day1', 'staff1']))));
  c('ユニオン管理者は DAYスタッフを決められる', await ok(DS('ua1', ['day1', 'staff1'])));
  c('決めた人はすぐ書ける', await ok(setDoc(doc(as('staff1'), 'ckNotice/U1'), N('staff1'))));
  c('外すと書けない', (await ok(DS('ua1', ['day1']))) && !(await ok(setDoc(doc(as('staff1'), 'ckNotice/U1'), N('staff1')))));
  c('ユニオン管理者でも、ほかのユニオンの DAYスタッフは決められない', !(await ok(setDoc(doc(as('ua1'), 'checkinUnions/U2'), { dayStaff: ['ua1'] }, { merge: true }))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
