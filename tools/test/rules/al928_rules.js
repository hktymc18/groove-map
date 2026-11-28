// v928（ATTACK LIST の使われ方の記録）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   readStats/{日付}/u/{uid}_al に、本人だけが書ける（app: 'al'）。読めるのはオーナーだけ。準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, increment, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'al-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/u1'), { name: '見本', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/' + OWN), { name: 'owner', union: 'REVE', status: 'active' });
  });
  const U1 = env.authenticatedContext('u1').firestore(), U2 = env.authenticatedContext('u2').firestore(), OW = env.authenticatedContext(OWN).firestore();
  const rec = (uid, app) => ({ uid, app, d: '20261128', n: increment(3), by: { 'list|users/people': increment(3) }, op: { '起動': increment(1) }, sec: increment(10), hr: { '11': increment(10) }, ts: { list: increment(10) }, at: 'x', ver: 2 });
  c('本人は ATTACK LIST の記録（u1_al）を書ける', await ok(setDoc(doc(U1, 'readStats/20261128/u/u1_al'), rec('u1', 'al'), { merge: true })));
  c('同じ記録に足し込める', await ok(setDoc(doc(U1, 'readStats/20261128/u/u1_al'), rec('u1', 'al'), { merge: true })));
  c('ほかの人の記録は書けない', !(await ok(setDoc(doc(U2, 'readStats/20261128/u/u1_al'), rec('u1', 'al'), { merge: true }))));
  c('名前と中身の app が合わないと書けない', !(await ok(setDoc(doc(U1, 'readStats/20261128/u/u1_nav'), rec('u1', 'al'), { merge: true }))));
  c('決まっていない app（goal）は書けない', !(await ok(setDoc(doc(U1, 'readStats/20261128/u/u1_goal'), rec('u1', 'goal'), { merge: true }))));
  c('NAVIGATOR の記録は今まで通り書ける', await ok(setDoc(doc(U1, 'readStats/20261128/u/u1_nav'), rec('u1', 'nav'), { merge: true })));
  c('本人は記録を読めない（読めるのはオーナーだけ）', !(await ok(getDoc(doc(U1, 'readStats/20261128/u/u1_al')))));
  c('オーナーは読める', await ok(getDoc(doc(OW, 'readStats/20261128/u/u1_al'))));
  c('本人は最後に開いた日（alSeenAt）を書ける', await ok(updateDoc(doc(U1, 'users/u1'), { alSeenAt: '2026-11-28T00:00:00Z' })));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
