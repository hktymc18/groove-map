// v847: 新機能のテスト（appConfig/features）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/feat847_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'feat-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'appConfig/features'), { flags: { sheet2: { on: false, testers: ['u1'] } }, at: 'x', by: 'x' });
    await setDoc(doc(d, 'users/u1'), { union: 'U1', status: 'active' });
  });
  const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  const anon = env.unauthenticatedContext().firestore();
  const user = env.authenticatedContext('u1').firestore();
  const owner = env.authenticatedContext(OWNER).firestore();
  const F = (x) => Object.assign({ flags: { sheet2: { on: true, testers: [] } }, at: 'y', by: OWNER }, x);
  c('ログインした人は読める', await ok(getDoc(doc(user, 'appConfig/features'))));
  c('ログインしていない人は読めない', !(await ok(getDoc(doc(anon, 'appConfig/features')))));
  c('ユニオンの設定は今までどおりだれでも読める', await ok(getDoc(doc(anon, 'appConfig/unions'))));
  c('オーナーは保存できる', await ok(setDoc(doc(owner, 'appConfig/features'), F())));
  c('オーナー以外は保存できない', !(await ok(setDoc(doc(user, 'appConfig/features'), F()))));
  c('ほかの項目は入れられない', !(await ok(setDoc(doc(owner, 'appConfig/features'), F({ x: 1 })))));
  c('flags が map でないと保存できない', !(await ok(setDoc(doc(owner, 'appConfig/features'), F({ flags: [] })))));
  c('ユニオンの書き方で features に list は入れられない', !(await ok(setDoc(doc(owner, 'appConfig/features'), { list: [], at: 'y', by: OWNER }))));
  c('ほかの appConfig は読めない', !(await ok(getDoc(doc(user, 'appConfig/other')))));
  c('ほかの appConfig はオーナーでも書けない', !(await ok(setDoc(doc(owner, 'appConfig/other'), F()))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
