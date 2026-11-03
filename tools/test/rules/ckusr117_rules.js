// 受付 v117（ユーザーの名簿 checkinUsers）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/ckusr117_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, writeBatch, increment } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'usr-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const U = (x) => Object.assign({ uid: 'u100', name: '見本 はなこ', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', cardToken: 'tokU100',
    active: true, visits: 1, firstEv: 'ev1', lastEv: 'ev1', lastAt: 1, createdAt: 1, createdBy: 'staff1', byName: '受付 係' }, x);
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'] });
    await setDoc(doc(d, 'checkinUnions/U2'), { name: 'U2' });
    await setDoc(doc(d, 'users/adm1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/other2'), { union: 'U2', status: 'active' });
    await setDoc(doc(d, 'users/off1'), { union: 'U1', status: 'disabled' });
    await setDoc(doc(d, 'users/nouni'), { status: 'active' });
    await setDoc(doc(d, 'checkinUsers/u100'), U());
    await setDoc(doc(d, 'checkinEvents/ev1'), { hostUnion: 'U1', unions: ['U1'], date: '2026-11-03' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const adm = env.authenticatedContext('adm1').firestore();
  const staff = env.authenticatedContext('staff1').firestore();
  const other = env.authenticatedContext('other2').firestore();
  const off = env.authenticatedContext('off1').firestore();
  const nouni = env.authenticatedContext('nouni').firestore();

  // 見る（管理者だけ）
  c('管理者は1件ずつ見られる', await ok(getDoc(doc(adm, 'checkinUsers/u100'))));
  c('管理者はユニオンで絞った一覧を見られる', await ok(getDocs(query(collection(adm, 'checkinUsers'), where('union', '==', 'U1')))));
  c('同じユニオンの受付の人でも見られない', !(await ok(getDoc(doc(staff, 'checkinUsers/u100')))));
  c('同じユニオンの受付の人は一覧も見られない', !(await ok(getDocs(query(collection(staff, 'checkinUsers'), where('union', '==', 'U1'))))));
  c('ほかのユニオンの人は見られない', !(await ok(getDoc(doc(other, 'checkinUsers/u100')))));
  c('ログインしていない人は見られない', !(await ok(getDoc(doc(anon, 'checkinUsers/u100')))));

  // 作る（受付の人＝ゲスト受付から。カード・番号→カードと一緒に）
  const reg = (db, id, x) => { const b = writeBatch(db); b.set(doc(db, 'checkinUsers/' + id), U(Object.assign({ uid: id, cardToken: 'tok' + id }, x)));
    b.set(doc(db, 'cards/tok' + id), { kind: 'user', no: id, name: '見本', union: 'U1', referrer: '', referrerNo: '', active: true, visits: 1, createdAt: 1 });
    b.set(doc(db, 'cardClaims/' + id), { t: 'tok' + id }); return b.commit(); };
  c('受付の人は登録できる（名簿・カード・番号→カード）', await ok(reg(staff, 'u200')));
  c('合同イベントで、ほかのユニオンの受付の人も登録できる', await ok(reg(other, 'u201')));
  c('管理者も登録できる', await ok(reg(adm, 'u202')));
  c('ログインしていない人は登録できない', !(await ok(setDoc(doc(anon, 'checkinUsers/u203'), U({ uid: 'u203' })))));
  c('無効のアカウントは登録できない', !(await ok(setDoc(doc(off, 'checkinUsers/u204'), U({ uid: 'u204' })))));
  c('ユニオンに入っていないアカウントは登録できない', !(await ok(setDoc(doc(nouni, 'checkinUsers/u205'), U({ uid: 'u205' })))));
  c('ID と uid がちがうと登録できない', !(await ok(setDoc(doc(staff, 'checkinUsers/u206'), U({ uid: 'u999' })))));
  c('ユニオンが空だと登録できない', !(await ok(setDoc(doc(staff, 'checkinUsers/u207'), U({ uid: 'u207', union: '' })))));
  c('名前が空だと登録できない', !(await ok(setDoc(doc(staff, 'checkinUsers/u208'), U({ uid: 'u208', name: '' })))));
  c('決まった項目以外は入れられない', !(await ok(setDoc(doc(staff, 'checkinUsers/u209'), U({ uid: 'u209', role: 'admin' })))));

  // 来場の回数（受付の人は 1 ずつ・回数と最後の来場だけ）
  c('受付の人は来場の回数を1つ増やせる', await ok(setDoc(doc(staff, 'checkinUsers/u100'), { visits: increment(1), lastAt: 2, lastEv: 'ev2' }, { merge: true })));
  c('ほかのユニオンの受付の人も1つ増やせる（合同イベント）', await ok(setDoc(doc(other, 'checkinUsers/u100'), { visits: increment(1), lastAt: 3, lastEv: 'ev3' }, { merge: true })));
  c('2つ以上は増やせない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { visits: increment(2) }, { merge: true }))));
  c('受付の人は名前を変えられない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { name: '別の名前' }, { merge: true }))));
  c('受付の人は無効にできない', !(await ok(setDoc(doc(staff, 'checkinUsers/u100'), { active: false }, { merge: true }))));
  c('無効のアカウントは回数も増やせない', !(await ok(setDoc(doc(off, 'checkinUsers/u100'), { visits: increment(1) }, { merge: true }))));

  // 直す・消す（管理者だけ）
  c('管理者は名前・紹介者・有効を直せる', await ok(setDoc(doc(adm, 'checkinUsers/u100'), { name: '見本 はな', referrer: '架空 次郎', active: false }, { merge: true })));
  c('管理者でもユニオンは変えられない', !(await ok(setDoc(doc(adm, 'checkinUsers/u100'), { union: 'U2' }, { merge: true }))));
  c('ほかのユニオンの人は直せない', !(await ok(setDoc(doc(other, 'checkinUsers/u100'), { name: 'x' }, { merge: true }))));
  c('受付の人は消せない', !(await ok(deleteDoc(doc(staff, 'checkinUsers/u100')))));
  c('管理者は消せる', await ok(deleteDoc(doc(adm, 'checkinUsers/u100'))));

  // 出席の記録（union は空・uUnion）は今までのルールのまま、参加ユニオンの受付の人が書ける
  c('ユーザーの出席（union 空）を受付の人が記録できる', await ok(setDoc(doc(staff, 'checkinEvents/ev1/attendance/u200'), { no: 'u200', name: '見本', union: '', uUnion: 'U1', kind: 'user', cardToken: 'toku200', fee: 1000, paid: true })));
  c('ビジネスの名簿（checkinMembers）のルールは変わらない（受付の人は作れない）', !(await ok(setDoc(doc(staff, 'checkinMembers/ZZ0009'), { no: 'ZZ0009', name: '見本', union: 'U1' }))));

  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
