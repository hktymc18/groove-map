// 受付 v167（ルール v35）：リーダーは会員証のタイトル・役職のバッジを変えられる。ほかの項目・BD/TE・特別カードは不可（架空データ）
// 準備と起動は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'lt-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const seed = () => env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { leaders: ['ld'], admins: [], trainers: [] });
    await setDoc(doc(d, 'checkinUnions/U2'), { leaders: [], admins: [] });
    for (const [u, un] of [['ld', 'U1'], ['mem', 'U1'], ['ld2', 'U2']]) await setDoc(doc(d, 'users/' + u), { union: un, status: 'active' });
    await setDoc(doc(d, 'checkinMembers/ZZ0001'), { no: 'ZZ0001', name: '見本', union: 'U1', cardTitle: 'GOLD', badges: [], cardToken: 'tok1' });
    await setDoc(doc(d, 'checkinMembers/ZZ0002'), { no: 'ZZ0002', name: '見本2', union: 'U1', cardTitle: 'TEAM ELITE', cardToken: 'tok2' });
    await setDoc(doc(d, 'checkinMembers/ZZ0003'), { no: 'ZZ0003', name: '見本3', union: 'U1', skin: 'x_a', cardToken: 'tok3' });
    await setDoc(doc(d, 'cards/tok1'), { no: 'ZZ0001', union: 'U1', cardTitle: 'GOLD' });
  });
  await seed();
  const as = u => env.authenticatedContext(u).firestore();
  const M = (db, no) => doc(db, 'checkinMembers/' + no);
  c('リーダーはタイトルを変えられる（GOLD → RUBY）', await ok(updateDoc(M(as('ld'), 'ZZ0001'), { cardTitle: 'RUBY' })));
  c('リーダーは役職のバッジを付けられる', await ok(updateDoc(M(as('ld'), 'ZZ0001'), { badges: ['EXPERT', 'DIRECTOR'] })));
  c('会員証（cards）のタイトルも変えられる（今まで通り）', await ok(updateDoc(doc(as('ld'), 'cards/tok1'), { cardTitle: 'RUBY' })));
  c('リーダーでも BLUE DIAMOND にはできない', !(await ok(updateDoc(M(as('ld'), 'ZZ0001'), { cardTitle: 'BLUE DIAMOND' }))));
  c('リーダーでも TEAM ELITE の人のタイトルは外せない', !(await ok(updateDoc(M(as('ld'), 'ZZ0002'), { cardTitle: 'RUBY' }))));
  c('リーダーでも特別カードは外せない', !(await ok(updateDoc(M(as('ld'), 'ZZ0003'), { skin: '' }))));
  c('リーダーでも名前は変えられない', !(await ok(updateDoc(M(as('ld'), 'ZZ0001'), { name: '別の人' }))));
  c('リーダーでもタイトルと一緒に名前は変えられない', !(await ok(updateDoc(M(as('ld'), 'ZZ0001'), { cardTitle: 'LAPIS', name: '別の人' }))));
  c('リーダーでもグレードは変えられない', !(await ok(updateDoc(M(as('ld'), 'ZZ0001'), { grade: 'JETCLUB' }))));
  c('一般メンバーはタイトルを変えられない', !(await ok(updateDoc(M(as('mem'), 'ZZ0001'), { cardTitle: 'EMERALD' }))));
  c('ほかのユニオンのリーダーは変えられない', !(await ok(updateDoc(M(as('ld2'), 'ZZ0001'), { cardTitle: 'EMERALD' }))));
  c('リーダーは会員証の再発行（cardToken の付け替え）ができる（今まで通り）', await ok(updateDoc(M(as('ld'), 'ZZ0001'), { cardToken: 'tokNew', cardSig: 'tokNew'.slice(0, 6), cardStatus: 'active' })));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
