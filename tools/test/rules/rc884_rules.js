// NAVIGATOR v884・受付 v161（readStats: 読み取りの内訳）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, increment } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2', D = '20261119';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'rc-rules', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const as = u => env.authenticatedContext(u).firestore(), anon = env.unauthenticatedContext().firestore();
  const R = (uid, app, x) => Object.assign({ uid, app, d: D, n: increment(5), by: { 'home|maps/months': increment(5) }, at: 't', ver: 1 }, x || {});
  c('ログインしている人は、自分の分（{uid}_nav）に足し込める', await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav'), { merge: true })));
  c('もう一度足し込める（更新）', await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav'), { merge: true })));
  c('受付（ck）の分も書ける', await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_ck'), R('u1', 'ck'), { merge: true })));
  c('ほかの人の分には書けない', !(await ok(setDoc(doc(as('u2'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav'), { merge: true }))) && !(await ok(setDoc(doc(as('u2'), 'readStats/' + D + '/u/u1_nav'), R('u2', 'nav'), { merge: true }))));
  c('ログインなしは、端末の番号（anon_…）だけに書ける', await ok(setDoc(doc(anon, 'readStats/' + D + '/u/anon_abc123def4_ck'), R('', 'ck'), { merge: true })) && !(await ok(setDoc(doc(anon, 'readStats/' + D + '/u/u1_ck'), R('', 'ck'), { merge: true }))));
  c('決まった項目以外・知らないアプリ・日付の形が違う・日付が合わないは書けない',
    !(await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav', { memo: 'x' }), { merge: true })))
    && !(await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_xx'), R('u1', 'xx'), { merge: true })))
    && !(await ok(setDoc(doc(as('u1'), 'readStats/2026-11-19/u/u1_nav'), R('u1', 'nav', { d: '2026-11-19' }), { merge: true })))
    && !(await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav', { d: '20261118' }), { merge: true }))));
  const big = {}; for (let i = 0; i < 101; i++) big['k' + i] = 1;
  c('内訳は100項目まで', !(await ok(setDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav'), R('u1', 'nav', { by: big })))));
  c('オーナーは読める・本人やほかの人は読めない', await ok(getDocs(collection(as(OWNER), 'readStats/' + D + '/u'))) && !(await ok(getDoc(doc(as('u1'), 'readStats/' + D + '/u/u1_nav')))) && !(await ok(getDocs(collection(anon, 'readStats/' + D + '/u')))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
