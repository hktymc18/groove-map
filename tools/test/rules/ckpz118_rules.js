// 受付 v118（ユーザーの最新の PRYSMiO を受付の人が入れる）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/ckpz118_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, increment } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'pz-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'] });
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/off1'), { union: 'U1', status: 'disabled' });
    await setDoc(doc(d, 'checkinUsers/u100'), { uid: 'u100', name: '見本', union: 'U1', cardToken: 'tok', active: true, visits: 2, lastAt: 1, lastEv: 'e1' });
    await setDoc(doc(d, 'cards/tok'), { kind: 'user', no: 'u100', name: '見本', union: 'U1', active: true });
  });
  const staff = env.authenticatedContext('staff1').firestore();
  const off = env.authenticatedContext('off1').firestore();
  const anon = env.unauthenticatedContext().firestore();
  c('受付の人は最新の PRYSMiO を入れられる（来場の回数はそのまま）', await ok(setDoc(doc(staff, 'checkinUsers/u100'), { prysm: 820, prysmAt: 5 }, { merge: true })));
  c('来場の回数+1 と一緒でもよい', await ok(setDoc(doc(staff, 'checkinUsers/u100'), { visits: increment(1), lastAt: 6, lastEv: 'e2' }, { merge: true })));
  c('数値でないと入れられない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { prysm: '820' }, { merge: true }))));
  c('3,000 より大きいと入れられない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { prysm: 5000 }, { merge: true }))));
  c('マイナスは入れられない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { prysm: -1 }, { merge: true }))));
  c('来場の回数を減らせない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { visits: 1 }, { merge: true }))));
  c('無効のアカウントは入れられない', !(await ok(setDoc(doc(off, 'checkinUsers/u100'), { prysm: 800 }, { merge: true }))));
  c('カードに測定・お買い上げの領収書を入れられる（受付の人）', await ok(setDoc(doc(staff, 'cards/tok'), { pz_e2: { v: 820, d: '2026-11-03' }, rcpt_b_e2: { kind: 'buy', amt: 12000, by: '架空 太郎' } }, { merge: true })));
  c('ログインしていない人はカードに書けない', !(await ok(setDoc(doc(anon, 'cards/tok'), { pz_e3: { v: 999 } }, { merge: true }))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
