// 受付 v182（相談の報告・数のまとめ）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   オーナーはすべての相談を読める（一覧・メッセージ）・書けるのは報告への「対応済み」だけ。数のまとめは DAY HOST・管理者・オーナーだけ読める
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'dm182-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const TK = 'a'.repeat(32), OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2', now = Date.now();
  const TH = (x) => Object.assign({ tk: TK, un: 'REVE', cno: 'u1', cname: '見本 はなこ', sUid: 'st1', sName: 'x', topic: 'skin', st: 'open', last: { by: 'u', t: 'x', at: now }, uRead: now, sRead: 0, byStaff: false, at: now, upAt: now }, x || {});
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/REVE'), { name: 'REVE', dayStaff: ['host1'] });
    for (const u of ['st1', 'mem1', 'host1']) await setDoc(doc(d, 'users/' + u), { name: u, union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/' + OWN), { name: 'owner', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'ckDm/r1'), TH({ rep: { at: now } }));
    await setDoc(doc(d, 'ckDm/n1'), TH());
    await setDoc(doc(d, 'ckDmStat/REVE'), { n30: 3, topics: { skin: 3 }, at: now });
  });
  const OW = env.authenticatedContext(OWN).firestore(), S1 = env.authenticatedContext('st1').firestore(), M1 = env.authenticatedContext('mem1').firestore(), H1 = env.authenticatedContext('host1').firestore();
  const AN = env.authenticatedContext('dev1', { firebase: { sign_in_provider: 'anonymous' } }).firestore(), NO = env.unauthenticatedContext().firestore();
  c('オーナーはユニオンのすべての相談を一覧で読める', await ok(getDocs(query(collection(OW, 'ckDm'), where('un', '==', 'REVE')))));
  c('オーナーは報告のない相談のメッセージも読める', await ok(getDocs(collection(OW, 'ckDm/n1/m'))));
  c('一般メンバー・DAY HOST は一覧を読めない', !(await ok(getDocs(query(collection(M1, 'ckDm'), where('un', '==', 'REVE'))))) && !(await ok(getDocs(query(collection(H1, 'ckDm'), where('un', '==', 'REVE'))))));
  c('スタッフは、ほかの人あての相談を一覧で読めない', !(await ok(getDocs(query(collection(S1, 'ckDm'), where('un', '==', 'REVE'))))));
  c('匿名の端末・未ログインは一覧を読めない', !(await ok(getDocs(query(collection(AN, 'ckDm'), where('un', '==', 'REVE'))))) && !(await ok(getDocs(query(collection(NO, 'ckDm'), where('un', '==', 'REVE'))))));
  c('オーナーは報告に「対応済み」を付けられる', await ok(updateDoc(doc(OW, 'ckDm/r1'), { repDone: { at: now, by: OWN } })));
  c('ほかの人の名前で「対応済み」は付けられない', !(await ok(updateDoc(doc(OW, 'ckDm/r1'), { repDone: { at: now, by: 'st1' } }))));
  c('オーナーは「対応済み」以外は変えられない', !(await ok(updateDoc(doc(OW, 'ckDm/r1'), { st: 'done' }))) && !(await ok(updateDoc(doc(OW, 'ckDm/r1'), { repDone: { at: now, by: OWN, note: 'x' } }))));
  c('報告がない相談には「対応済み」を付けられない', !(await ok(updateDoc(doc(OW, 'ckDm/n1'), { repDone: { at: now, by: OWN } }))));
  c('スタッフは「対応済み」を付けられない', !(await ok(updateDoc(doc(S1, 'ckDm/r1'), { repDone: { at: now, by: 'st1' } }))));
  c('数のまとめは DAY HOST・オーナーが読める', await ok(getDoc(doc(H1, 'ckDmStat/REVE'))) && await ok(getDoc(doc(OW, 'ckDmStat/REVE'))));
  c('一般メンバー・相談スタッフ・お客さん・未ログインは読めない', !(await ok(getDoc(doc(M1, 'ckDmStat/REVE')))) && !(await ok(getDoc(doc(S1, 'ckDmStat/REVE')))) && !(await ok(getDoc(doc(AN, 'ckDmStat/REVE')))) && !(await ok(getDoc(doc(NO, 'ckDmStat/REVE')))));
  c('数のまとめは誰も書けない（サーバーだけ）', !(await ok(setDoc(doc(OW, 'ckDmStat/REVE'), { n30: 0 }))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
