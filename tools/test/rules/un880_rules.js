// NAVIGATOR v880（所属ユニオンは決めた一覧の名前だけ: appConfig/unions.names）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'un-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const as = u => env.authenticatedContext(u).firestore();
  const P = (un, x) => Object.assign({ name: '見本 太郎', union: un, area: '福岡', upRuby: '見本', upBd: '見本', status: 'pending', role: 'member' }, x || {});
  // ① 一覧（names）がまだ無い時は今までどおり
  await env.withSecurityRulesDisabled(async (cx) => { await setDoc(doc(cx.firestore(), 'appConfig/unions'), { list: [{ name: 'LIEN', upbd: '' }] }); });
  c('names がまだ無い時は、今までどおり登録できる（表記ゆれでも）', await ok(setDoc(doc(as('a0'), 'users/a0'), P('lien '))));
  // オーナーが names を入れる
  c('オーナーは names を保存できる', await ok(setDoc(doc(as(OWNER), 'appConfig/unions'), { names: ['LIEN', 'REVE'] }, { merge: true })));
  c('オーナー以外は names を変えられない', !(await ok(setDoc(doc(as('a0'), 'appConfig/unions'), { names: ['X'] }, { merge: true }))));
  c('names は文字の一覧だけ・決まった項目以外は保存できない', !(await ok(setDoc(doc(as(OWNER), 'appConfig/unions'), { list: [], names: 'LIEN' }))) && !(await ok(setDoc(doc(as(OWNER), 'appConfig/unions'), { list: [], other: 1 }))));
  // ② 新規登録
  c('一覧の名前（LIEN）なら登録できる', await ok(setDoc(doc(as('a1'), 'users/a1'), P('LIEN'))));
  c('表記ゆれ（lien・LIEN 東京・リアン）では登録できない', !(await ok(setDoc(doc(as('a2'), 'users/a2'), P('lien')))) && !(await ok(setDoc(doc(as('a2'), 'users/a2'), P('LIEN 東京')))) && !(await ok(setDoc(doc(as('a2'), 'users/a2'), P('リアン')))));
  // ③ 本人の変更
  c('本人は、ほかの項目は今までどおり保存できる', await ok(updateDoc(doc(as('a1'), 'users/a1'), { area: '東京' })));
  c('本人は、一覧の名前（REVE）には変えられる', await ok(updateDoc(doc(as('a1'), 'users/a1'), { union: 'REVE' })));
  c('本人は、一覧に無い名前には変えられない', !(await ok(updateDoc(doc(as('a1'), 'users/a1'), { union: 'reve' }))));
  c('前からの表記ゆれの人も、ユニオンを変えない保存はできる', await ok(updateDoc(doc(as('a0'), 'users/a0'), { area: '大阪' })));
  c('前からの表記ゆれの人は、一覧の名前に選び直せる', await ok(updateDoc(doc(as('a0'), 'users/a0'), { union: 'LIEN', unionSelectedV2: true })));
  // ④ オーナーは直せる
  await env.withSecurityRulesDisabled(async (cx) => { await setDoc(doc(cx.firestore(), 'users/a3'), P('ＲＥＶＥ')); });
  c('オーナーは、表記ゆれの人を一覧の名前に直せる', await ok(setDoc(doc(as(OWNER), 'users/a3'), { union: 'REVE', unionFixedFrom: 'ＲＥＶＥ' }, { merge: true })));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
