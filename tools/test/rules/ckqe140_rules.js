// 受付 v140（クエストの編集: ckQuest/{ユニオン}）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'qe-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'], unionAdmins: ['ua1'], dayStaff: ['day1'] });
    await setDoc(doc(d, 'checkinUnions/U2'), { name: 'U2' });
    for (const u of ['adm1', 'ua1', 'day1', 'staff1']) await setDoc(doc(d, 'users/' + u), { union: 'U1', status: 'active' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const as = u => env.authenticatedContext(u).firestore();
  const Q = (by, x) => Object.assign({ co: { diet: [{ k: 'water', t: '朝、コップ1杯の水を飲む' }, { k: 'walk', t: '20分歩く', off: true }], yuragi: [{ k: 'am', t: '朝のスキンケア' }] }, by, at: serverTimestamp() }, x);
  c('DAYスタッフは自分のユニオンのクエストを保存できる', await ok(setDoc(doc(as('day1'), 'ckQuest/U1'), Q('day1'))));
  c('ユニオン管理者も保存できる', await ok(setDoc(doc(as('ua1'), 'ckQuest/U1'), Q('ua1'))));
  c('DAYスタッフでも、ほかのユニオンは保存できない', !(await ok(setDoc(doc(as('day1'), 'ckQuest/U2'), Q('day1')))));
  c('受付管理者だけの人は保存できない', !(await ok(setDoc(doc(as('adm1'), 'ckQuest/U1'), Q('adm1')))));
  c('ふつうの人・ログインなしは保存できない', !(await ok(setDoc(doc(as('staff1'), 'ckQuest/U1'), Q('staff1')))) && !(await ok(setDoc(doc(anon, 'ckQuest/U1'), Q('x')))));
  c('ほかの人の名前（by）では保存できない', !(await ok(setDoc(doc(as('day1'), 'ckQuest/U1'), Q('ua1')))));
  c('知らないコースは入れられない', !(await ok(setDoc(doc(as('day1'), 'ckQuest/U1'), Q('day1', { co: { diet: [], other: [] } })))));
  c('1コース11こ以上は入れられない', !(await ok(setDoc(doc(as('day1'), 'ckQuest/U1'), Q('day1', { co: { diet: Array.from({ length: 11 }, (_, i) => ({ k: 'q' + i, t: 'x' })) } })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(as('day1'), 'ckQuest/U1'), Q('day1', { link: 'https://example.com' })))));
  c('アプリ（ログインなし）が1件読める', await ok(getDoc(doc(anon, 'ckQuest/U1'))));
  c('ない時も読める（はじめの内容を使う）', await ok(getDoc(doc(anon, 'ckQuest/U2'))));
  c('一覧は見られない', !(await ok(getDocs(collection(anon, 'ckQuest')))));
  c('受付管理者だけの人は消せない', !(await ok(deleteDoc(doc(as('adm1'), 'ckQuest/U1')))));
  c('DAYスタッフは消せる（はじめの内容にもどす）', await ok(deleteDoc(doc(as('day1'), 'ckQuest/U1'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
