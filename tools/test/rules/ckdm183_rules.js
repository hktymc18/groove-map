// 受付 v183（相談の写真）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   メッセージに img（JPEG の data URL・40万文字まで）を付けられる。写真だけなら文は空でよい。それ以外の形はだめ
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'dm183-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const TK = 'a'.repeat(32), now = Date.now();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/st1'), { name: 'st1', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'ckBind/' + TK), { uids: ['dev1'], by: 'self', at: 1 });
    await setDoc(doc(d, 'ckDm/t1'), { tk: TK, un: 'REVE', sUid: 'st1', st: 'open', at: now, upAt: now });
  });
  const A1 = env.authenticatedContext('dev1', { firebase: { sign_in_provider: 'anonymous' } }).firestore(), S1 = env.authenticatedContext('st1').firestore();
  const J = 'data:image/jpeg;base64,' + Buffer.alloc(3000, 7).toString('base64');
  const M = (by, uid, x) => Object.assign({ by, uid, t: '', at: serverTimestamp() }, x);
  let n = 0; const put = (dbx, m) => setDoc(doc(dbx, 'ckDm/t1/m/m' + (++n)), m);
  c('お客さんは写真だけを送れる（文は空）', await ok(put(A1, M('u', 'dev1', { img: J }))));
  c('写真と文をいっしょに送れる', await ok(put(A1, M('u', 'dev1', { t: '右のほほです', img: J }))));
  c('スタッフも写真を送れる', await ok(put(S1, M('s', 'st1', { img: J }))));
  c('文も写真も無いのはだめ', !(await ok(put(A1, M('u', 'dev1', {})))));
  c('JPEG でないものはだめ（PNG・ほかの形）', !(await ok(put(A1, M('u', 'dev1', { img: 'data:image/png;base64,AAAA' })))) && !(await ok(put(A1, M('u', 'dev1', { img: 'javascript:alert(1)' })))));
  c('文字でないものはだめ', !(await ok(put(A1, M('u', 'dev1', { img: 123 })))));
  c('40万文字をこえる写真はだめ', !(await ok(put(A1, M('u', 'dev1', { img: 'data:image/jpeg;base64,' + 'A'.repeat(400000) })))));
  c('ほかの欄は付けられない', !(await ok(put(A1, M('u', 'dev1', { img: J, x: 1 })))));
  c('ひもづいていない端末は送れない', !(await ok(put(env.authenticatedContext('dev2', { firebase: { sign_in_provider: 'anonymous' } }).firestore(), M('u', 'dev2', { img: J })))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
