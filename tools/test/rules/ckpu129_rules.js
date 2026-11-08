// 受付 v129（ユーザーのスマホの通知の送り先: ckPush/{ユーザーのID}）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TU = 'abababababababababababababababab', TM = '0123456789abcdef0123456789abcdef', TOFF = 'efefefefefefefefefefefefefefefef';
const UID = 'u17620000000001';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'pu-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'cards/' + TU), { kind: 'user', no: UID, name: '見本 はなこ', union: 'U1', active: true });
    await setDoc(doc(d, 'cards/' + TOFF), { kind: 'user', no: 'u17620000000003', name: '見本 無効', union: 'U1', active: false });
    await setDoc(doc(d, 'cards/' + TM), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true });
  });
  const anon = env.unauthenticatedContext().firestore();
  const staff = env.authenticatedContext('staff1').firestore();
  const S = (x) => Object.assign({ card: TU, union: 'U1', t: 'fcm-token-1', on: true, ua: 'test', at: serverTimestamp() }, x);
  c('ユーザーのカードの本人は、通知の送り先を入れられる', await ok(setDoc(doc(anon, 'ckPush/' + UID), S())));
  c('オフにできる（上書き）', await ok(setDoc(doc(anon, 'ckPush/' + UID), S({ on: false }))));
  c('ほかの人のIDには入れられない（カードとIDが違う）', !(await ok(setDoc(doc(anon, 'ckPush/u17620000000099'), S()))));
  c('ビジネスの会員証では入れられない', !(await ok(setDoc(doc(anon, 'ckPush/ZZ0001'), S({ card: TM })))));
  c('無効のカードでは入れられない', !(await ok(setDoc(doc(anon, 'ckPush/u17620000000003'), S({ card: TOFF })))));
  c('ユニオンがカードと違うと入れられない', !(await ok(setDoc(doc(anon, 'ckPush/' + UID), S({ union: 'U2' })))));
  c('ないカードでは入れられない', !(await ok(setDoc(doc(anon, 'ckPush/' + UID), S({ card: 'f'.repeat(32) })))));
  c('宛先が空だと入れられない', !(await ok(setDoc(doc(anon, 'ckPush/' + UID), S({ t: '' })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(anon, 'ckPush/' + UID), S({ name: '見本' })))));
  c('だれも読めない（本人も）', !(await ok(getDoc(doc(anon, 'ckPush/' + UID)))));
  c('受付の人も読めない', !(await ok(getDoc(doc(staff, 'ckPush/' + UID)))));
  c('一覧も見られない', !(await ok(getDocs(collection(staff, 'ckPush')))));
  c('受付の人は消せない', !(await ok(deleteDoc(doc(staff, 'ckPush/' + UID)))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
