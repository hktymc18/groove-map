// 受付 v147（体感のその後: ckFollow・checkinUnions.hostFollow）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'fu-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', unionAdmins: ['ua1'], admins: ['adm1'], dayStaff: ['host1'] });
    for (const [u, un] of [['ua1', 'U2'], ['adm1', 'U1'], ['host1', 'U1'], ['mem1', 'U1'], ['out1', 'U9']]) await setDoc(doc(d, 'users/' + u), { union: un, status: 'active' });
    await setDoc(doc(d, 'checkinUsers/u1'), { uid: 'u1', name: '見本 はなこ', union: 'U1', active: true });
  });
  const as = u => env.authenticatedContext(u).firestore(), anon = env.unauthenticatedContext().firestore();
  const F = (by, x) => Object.assign({ union: 'U1', refNo: 'A001', name: '見本 はなこ', shop: '2026-11-10', buy1: '', nBuy: 0, amt: 0, adp: false, by, at: 1 }, x || {});
  c('同じユニオンのメンバー（紹介者など）は、その後の要点を書ける', await ok(setDoc(doc(as('mem1'), 'ckFollow/u1'), F('mem1'))));
  c('ほかのユニオンの人・ログインなしは書けない', !(await ok(setDoc(doc(as('out1'), 'ckFollow/u1'), F('out1')))) && !(await ok(setDoc(doc(anon, 'ckFollow/u1'), F('x')))));
  c('ユーザーとちがうユニオンでは書けない・決まった項目以外は書けない・ほかの人の名前（by）では書けない',
    !(await ok(setDoc(doc(as('mem1'), 'ckFollow/u1'), F('mem1', { union: 'U9' })))) && !(await ok(setDoc(doc(as('mem1'), 'ckFollow/u1'), F('mem1', { memo: 'x' })))) && !(await ok(setDoc(doc(as('mem1'), 'ckFollow/u1'), F('host1')))));
  c('受付にいないユーザーには書けない', !(await ok(setDoc(doc(as('mem1'), 'ckFollow/zz'), F('mem1')))));
  const L = (u) => getDocs(query(collection(as(u), 'ckFollow'), where('union', '==', 'U1')));
  c('ユニオン管理者は読める', await ok(L('ua1')));
  c('ふつうのメンバー・受付管理者だけの人は読めない', !(await ok(L('mem1'))) && !(await ok(L('adm1'))));
  c('DAY HOST は「DAY HOST にも見せる」がオフだと読めない', !(await ok(L('host1'))));
  c('受付管理者は「DAY HOST にも見せる」を変えられない', !(await ok(updateDoc(doc(as('adm1'), 'checkinUnions/U1'), { hostFollow: true }))));
  c('DAY HOST 本人も変えられない', !(await ok(updateDoc(doc(as('host1'), 'checkinUnions/U1'), { hostFollow: true }))));
  c('ユニオン管理者は「DAY HOST にも見せる」をオンにできる', await ok(updateDoc(doc(as('ua1'), 'checkinUnions/U1'), { hostFollow: true })));
  c('オンにすると DAY HOST も読める', await ok(L('host1')));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
