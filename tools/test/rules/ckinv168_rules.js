// 受付 v168（ルール v36）：棚卸し checkinInventory。サーバーだけが書く・回答は お知らせを受けた人／管理者だけ（架空データ）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'invr-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { unionAdmins: ['adm'] });
    for (const [u, un] of [['up1', 'U1'], ['tr1', 'U1'], ['mem', 'U1'], ['adm', 'U1'], ['other', 'U2']]) await setDoc(doc(d, 'users/' + u), { union: un, status: 'active' });
    await setDoc(doc(d, 'checkinInventory/U1'), { list: [{ no: 'A1' }], who: { A1: ['up1', 'tr1'] } });
  });
  const as = u => env.authenticatedContext(u).firestore();
  const A = (db, no, x) => setDoc(doc(db, 'checkinInventory/U1/ans/' + no), Object.assign({ a: 'quit', by: x && x.by || '', at: 1 }, x));
  c('同じユニオンの人は読める', await ok(getDoc(doc(as('mem'), 'checkinInventory/U1'))));
  c('ほかのユニオンの人は読めない', !(await ok(getDoc(doc(as('other'), 'checkinInventory/U1')))));
  c('ログインしていない人は読めない', !(await ok(getDoc(doc(env.unauthenticatedContext().firestore(), 'checkinInventory/U1')))));
  c('一覧はだれも書けない（サーバーだけ）', !(await ok(setDoc(doc(as('adm'), 'checkinInventory/U1'), { list: [] }))));
  c('お知らせを受けた人（UPルビー）は回答できる', await ok(A(as('up1'), 'A1', { by: 'up1' })));
  c('お知らせを受けた人（担当）も回答できる', await ok(A(as('tr1'), 'A1', { by: 'tr1', a: 'ok' })));
  c('管理者は相手でなくても回答できる', await ok(A(as('adm'), 'A9', { by: 'adm', a: 'wait' })));
  c('相手でない人は回答できない', !(await ok(A(as('mem'), 'A1', { by: 'mem' }))));
  c('他人の名前（by）では回答できない', !(await ok(A(as('up1'), 'A1', { by: 'tr1' }))));
  c('決まった答え以外は書けない', !(await ok(A(as('up1'), 'A1', { by: 'up1', a: 'delete' }))));
  c('ほかの項目は書けない', !(await ok(A(as('up1'), 'A1', { by: 'up1', note: 'x' }))));
  c('回答は消せない（サーバーが消す）', !(await ok(deleteDoc(doc(as('adm'), 'checkinInventory/U1/ans/A1')))));
  c('自分の回答は読める', await ok(getDoc(doc(as('tr1'), 'checkinInventory/U1/ans/A1'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
