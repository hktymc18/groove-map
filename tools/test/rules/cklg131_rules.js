// 受付 v131（ラウンジ: ckLounge・cards/{トークン}/lounge・👏）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// v139: スタッフ（出す・出さない・確認待ちの一覧・消す）はオーナー・ユニオン管理者・DAYスタッフだけ（受付管理者だけの人は不可）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where, writeBatch, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TA = 'abababababababababababababababab', TB = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', TM = '0123456789abcdef0123456789abcdef';
const UA = 'u17620000000001', UB = 'u17620000000002';
const P1 = 'aaaaaaaaaaaaaaaaaaaa', P2 = 'bbbbbbbbbbbbbbbbbbbb', P3 = 'cccccccccccccccccccc';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'lg-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'], dayStaff: ['day1'] });
    await setDoc(doc(d, 'users/adm1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/day1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'cards/' + TA), { kind: 'user', no: UA, name: '見本 はなこ', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/' + UA), { t: TA });
    await setDoc(doc(d, 'cards/' + TB), { kind: 'user', no: UB, name: '見本 さくら', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/' + UB), { t: TB });
    await setDoc(doc(d, 'cards/' + TM), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/ZZ0001'), { t: TM });
  });
  const anon = env.unauthenticatedContext().firestore();
  const adm = env.authenticatedContext('adm1').firestore(), day = env.authenticatedContext('day1').firestore(), staff = env.authenticatedContext('staff1').firestore();
  const L = (x) => Object.assign({ union: 'U1', uid: UA, n: '見本 はなこ', co: 'ダイエット編', t: '今週は毎日歩けました', st: 'wait', at: serverTimestamp() }, x);
  const post = (tok, pid, x) => { const b = writeBatch(anon);
    b.set(doc(anon, 'ckLounge/' + pid), L(x)); b.set(doc(anon, 'cards/' + tok + '/lounge/' + pid), { at: serverTimestamp() }); return b.commit(); };
  c('ほかの人の名前では投稿できない', !(await ok(post(TA, P3, { n: '別の人' }))));
  c('ほかの人のIDでは投稿できない（自分のカードの印とIDが違う）', !(await ok(post(TA, P3, { uid: UB, n: '見本 さくら' }))));
  c('はじめから ok では投稿できない', !(await ok(post(TA, P3, { st: 'ok' }))));
  c('61文字以上は投稿できない', !(await ok(post(TA, P3, { t: 'あ'.repeat(61) }))));
  c('ビジネスの会員証からは投稿できない', !(await ok(post(TM, P3, { uid: 'ZZ0001', n: '架空 太郎' }))));
  c('自分の印がないと投稿できない', !(await ok(setDoc(doc(anon, 'ckLounge/' + P3), L()))));
  c('ユーザーのカードの本人は投稿できる（確認待ち）', await ok(post(TA, P1, {})));
  c('さくらも投稿できる', await ok(post(TB, P2, { uid: UB, n: '見本 さくら' })));
  c('確認待ちは一覧に出ない（ログインなし）', !(await ok(getDocs(query(collection(anon, 'ckLounge'), where('union', '==', 'U1'), where('st', '==', 'wait'))))));
  c('本人は自分の投稿を書き換えられない', !(await ok(updateDoc(doc(anon, 'ckLounge/' + P1), { st: 'ok' }))));
  c('ふつうの受付の人は出せない', !(await ok(updateDoc(doc(staff, 'ckLounge/' + P1), { st: 'ok', okAt: serverTimestamp(), by: 'staff1' }))));
  c('v139: 受付管理者だけの人は確認待ちの一覧を見られない', !(await ok(getDocs(query(collection(adm, 'ckLounge'), where('union', '==', 'U1'), where('st', '==', 'wait'))))));
  c('v139: 受付管理者だけの人は「出す」ことができない', !(await ok(updateDoc(doc(adm, 'ckLounge/' + P1), { st: 'ok', okAt: serverTimestamp(), by: 'adm1' }))));
  c('DAYスタッフは確認待ちの一覧を見られる', await ok(getDocs(query(collection(day, 'ckLounge'), where('union', '==', 'U1'), where('st', '==', 'wait')))));
  c('DAYスタッフは「出す」ことができる', await ok(updateDoc(doc(day, 'ckLounge/' + P1), { st: 'ok', okAt: serverTimestamp(), by: 'day1' })));
  c('DAYスタッフでも文は変えられない', !(await ok(updateDoc(doc(day, 'ckLounge/' + P1), { t: '別の文', by: 'day1' }))));
  c('出ている投稿は一覧で読める（ログインなし）', await ok(getDocs(query(collection(anon, 'ckLounge'), where('union', '==', 'U1'), where('st', '==', 'ok')))));
  // 👏
  const clap = (tok, uid, pid) => { const b = writeBatch(anon);
    b.set(doc(anon, 'ckLounge/' + pid + '/clap/' + uid), { at: serverTimestamp() }); b.set(doc(anon, 'cards/' + tok + '/clap/' + pid), { at: serverTimestamp() }); return b.commit(); };
  c('出ている投稿に 👏 できる', await ok(clap(TB, UB, P1)));
  c('同じ人は2回 👏 できない', !(await ok(clap(TB, UB, P1))));
  c('ほかの人のIDで 👏 できない', !(await ok(clap(TB, UA, P1))));
  c('確認待ちの投稿には 👏 できない', !(await ok(clap(TA, UA, P2))));
  c('👏 の数を数えられる（一覧）', await ok(getDocs(collection(anon, 'ckLounge/' + P1 + '/clap'))));
  // 取り消し
  c('印を消さずに投稿だけ消すことはできない（ほかの人も）', !(await ok(deleteDoc(doc(anon, 'ckLounge/' + P2)))));
  c('本人は、自分の印と一緒に取り消せる', await ok((() => { const b = writeBatch(anon); b.delete(doc(anon, 'ckLounge/' + P2)); b.delete(doc(anon, 'cards/' + TB + '/lounge/' + P2)); return b.commit(); })()));
  c('ほかの人の印では取り消せない', !(await ok((() => { const b = writeBatch(anon); b.delete(doc(anon, 'ckLounge/' + P1)); b.delete(doc(anon, 'cards/' + TB + '/lounge/' + P1)); return b.commit(); })())));
  c('v139: 受付管理者だけの人は投稿を消せない', !(await ok(deleteDoc(doc(adm, 'ckLounge/' + P1)))));
  c('DAYスタッフは出さなかった投稿の一覧を見られる', await ok(getDocs(query(collection(day, 'ckLounge'), where('union', '==', 'U1'), where('st', '==', 'ng')))));
  c('DAYスタッフは投稿を消せる', await ok(deleteDoc(doc(day, 'ckLounge/' + P1))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
