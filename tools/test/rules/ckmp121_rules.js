// 受付 v121（ユーザーのマイプラン cards/{token}/plan/me）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/ckmp121_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'mp-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'cards/tokU'), { kind: 'user', no: 'u1', name: '見本', union: 'U1', active: true });
    await setDoc(doc(d, 'cards/tokOff'), { kind: 'user', no: 'u2', name: '見本', union: 'U1', active: false });
    await setDoc(doc(d, 'cards/tokM'), { no: 'ZZ0001', name: '見本', union: 'U1', active: true });
  });
  const anon = env.unauthenticatedContext().firestore();
  const P = (x) => Object.assign({ course: 'diet', goal: '30日つづける', qs: ['water', 'walk'], start: '2026-11-03', days: { '2026-11-03': ['water'] }, atMs: Date.now() }, x);
  c('本人（ログインなし）はマイプランを保存できる', await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P())));
  c('本人は読める', await ok(getDoc(doc(anon, 'cards/tokU/plan/me'))));
  c('一覧は見られない', !(await ok(getDocs(collection(anon, 'cards/tokU/plan')))));
  c('ビジネスの会員証には作れない', !(await ok(setDoc(doc(anon, 'cards/tokM/plan/me'), P()))));
  c('無効のユーザーのカードには作れない', !(await ok(setDoc(doc(anon, 'cards/tokOff/plan/me'), P()))));
  c('存在しないカードには作れない', !(await ok(setDoc(doc(anon, 'cards/nope/plan/me'), P()))));
  c('me 以外の名前は作れない', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/x'), P()))));
  c('決まったコース以外は保存できない', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P({ course: 'other' })))));
  c('目標は40字まで', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P({ goal: 'あ'.repeat(41) })))));
  c('クエスト0こは保存できない', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P({ qs: [] })))));
  c('クエスト6こは保存できない', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P({ qs: ['a', 'b', 'c', 'd', 'e', 'f'] })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(anon, 'cards/tokU/plan/me'), P({ x: 1 })))));
  c('ログインしていない人は消せない', !(await ok(require('firebase/firestore').deleteDoc(doc(anon, 'cards/tokU/plan/me')))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
