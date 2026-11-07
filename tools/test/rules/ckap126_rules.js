// 受付 v126（ユーザーの申し込み: ckJoin・ckApply・cards/{トークン}/join）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（NODE_PATH=<その場所>/node_modules node tools/test/rules/ckap126_rules.js）
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, updateDoc, writeBatch, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TOKA = '0123456789abcdef0123456789abcdef', TOKT = 'feedfeedfeedfeedfeedfeedfeedfeed', TOKU = 'abababababababababababababababab', TOKOLD = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd';
const RK = 'r_abcdefghijkmnpqrstuv', RK2 = 'r_bbbbbbbbbbbbbbbbbbbb', RK3 = 'r_cccccccccccccccccccc';
const AID = 'abcdefghijkmnpqrstuvwxyz', AID2 = 'bcdefghijkmnpqrstuvwxyz2', AID3 = 'cdefghijkmnpqrstuvwxyz23';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'ap-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1' });
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/other2'), { union: 'U2', status: 'active' });
    await setDoc(doc(d, 'users/off1'), { union: 'U1', status: 'disabled' });
    await setDoc(doc(d, 'users/j2DPDAccCygHmR9i5K3bTvHnH0V2'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'checkinEvents/ev1'), { hostUnion: 'U1', unions: ['U1'], date: '2026-12-07', name: '12月のDAY' });
    await setDoc(doc(d, 'cards/' + TOKA), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/ZZ0001'), { t: TOKA });
    await setDoc(doc(d, 'cards/' + TOKOLD), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true });   // 再発行前の古い会員証
    await setDoc(doc(d, 'cards/' + TOKT), { no: 'ZZ0002', name: '見本 研修', union: 'U1', active: true, trainee: true });
    await setDoc(doc(d, 'cardClaims/ZZ0002'), { t: TOKT });
    await setDoc(doc(d, 'cards/' + TOKU), { kind: 'user', no: 'u17620000000001', name: '見本 はなこ', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/u17620000000001'), { t: TOKU });
  });
  const anon = env.unauthenticatedContext().firestore();
  const staff = env.authenticatedContext('staff1').firestore();
  const other = env.authenticatedContext('other2').firestore();
  const off = env.authenticatedContext('off1').firestore();

  // 会場のQR（受付の人が作る）
  const V = (x) => Object.assign({ kind: 'venue', union: 'U1', evId: 'ev1', by: 'staff1', at: serverTimestamp() }, x);
  c('参加ユニオンの受付の人は会場のQRを作れる', await ok(setDoc(doc(staff, 'ckJoin/v_ev1'), V())));
  c('もう一度作り直せる（上書き）', await ok(setDoc(doc(staff, 'ckJoin/v_ev1'), V())));
  c('ログインしていない人は会場のQRを作れない', !(await ok(setDoc(doc(anon, 'ckJoin/v_ev1'), V()))));
  c('ほかのユニオンの人は作れない', !(await ok(setDoc(doc(other, 'ckJoin/v_ev1'), V({ by: 'other2' })))));
  c('無効のアカウントは作れない', !(await ok(setDoc(doc(off, 'ckJoin/v_ev1'), V({ by: 'off1' })))));
  c('キーとイベントが合わないと作れない', !(await ok(setDoc(doc(staff, 'ckJoin/v_evX'), V()))));
  c('イベントに入っていないユニオンでは作れない', !(await ok(setDoc(doc(staff, 'ckJoin/v_ev1'), V({ union: 'U9' })))));
  c('ほかの人の名前（by）では作れない', !(await ok(setDoc(doc(staff, 'ckJoin/v_ev1'), V({ by: 'x' })))));
  c('入口は誰でも1件ずつ開ける', await ok(getDoc(doc(anon, 'ckJoin/v_ev1'))));
  c('入口の一覧は見られない', !(await ok(getDocs(collection(anon, 'ckJoin')))));

  // 紹介者のQR（会員証から・ログインなし。会員証の join/me と一緒に）
  const refBatch = (db, tok, key, x) => { const b = writeBatch(db);
    b.set(doc(db, 'cards/' + tok + '/join/me'), { k: key, at: serverTimestamp() });
    b.set(doc(db, 'ckJoin/' + key), Object.assign({ kind: 'ref', union: 'U1', refNo: 'ZZ0001', refName: '架空 太郎', at: serverTimestamp() }, x));
    return b.commit(); };
  c('ほかの人の番号では作れない（会員証と番号が合わない）', !(await ok(refBatch(anon, TOKU, RK2, {}))));
  c('再発行前の古い会員証からは作れない', !(await ok(refBatch(anon, TOKOLD, RK2, {}))));
  c('研修生の会員証からは作れない', !(await ok(refBatch(anon, TOKT, RK3, { refNo: 'ZZ0002', refName: '見本 研修' }))));
  c('名前が会員証と違うと作れない', !(await ok(refBatch(anon, TOKA, RK2, { refName: '別の人' }))));
  c('ユニオンが会員証と違うと作れない', !(await ok(refBatch(anon, TOKA, RK2, { union: 'U2' }))));
  c('会員証の本人は紹介者のQRを作れる', await ok(refBatch(anon, TOKA, RK, {})));
  c('紹介者のQRは書き換えられない', !(await ok(setDoc(doc(anon, 'ckJoin/' + RK), { kind: 'ref', union: 'U1', refNo: 'ZZ0001', refName: '架空 太郎', at: serverTimestamp() }))));
  c('会員証のキーは書き換えられない', !(await ok(setDoc(doc(anon, 'cards/' + TOKA + '/join/me'), { k: RK2, at: serverTimestamp() }))));
  c('会員証のキーだけ（入口なし）は作れない', !(await ok(setDoc(doc(anon, 'cards/' + TOKOLD + '/join/me'), { k: RK3, at: serverTimestamp() }))));

  // 申し込み（本人・ログインなし）
  const A = (x) => Object.assign({ join: 'v_ev1', name: '見本 みどり', kana: 'みほん みどり', union: 'U1', refNo: '', refName: '架空 太郎', evId: 'ev1', ok: true, st: 'wait', at: serverTimestamp() }, x);
  c('会場のQRから申し込める', await ok(setDoc(doc(anon, 'ckApply/' + AID), A())));
  c('紹介者のQRから申し込める', await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ join: RK, refNo: 'ZZ0001', evId: '' }))));
  c('紹介者のQRで、紹介者を変えては申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ join: RK, refNo: 'ZZ0001', refName: '別の人', evId: '' })))));
  c('会場のQRで、紹介者の番号を入れては申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ refNo: 'ZZ0001' })))));
  c('ユニオンが入口と違うと申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ union: 'U2' })))));
  c('ない入口では申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ join: 'v_nope' })))));
  c('同意がないと申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ ok: false })))));
  c('名前が空だと申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ name: '' })))));
  c('41文字以上の名前は申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ name: 'あ'.repeat(41) })))));
  c('はじめから done では申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ st: 'done' })))));
  c('決まった項目以外（電話番号など）は入れられない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID3), A({ tel: '000' })))));
  c('キーが短いと申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/short'), A()))));
  c('申し込みを書き換えられない（本人も）', !(await ok(setDoc(doc(anon, 'ckApply/' + AID), A({ name: '別の名前' })))));
  c('申し込みは1件ずつ開ける', await ok(getDoc(doc(anon, 'ckApply/' + AID))));
  c('申し込みの一覧は見られない（受付の人も）', !(await ok(getDocs(collection(staff, 'ckApply')))));

  // 受付で「登録して受付」（ユーザーの名簿・カードと同じ一括書き込みで done）
  const NT = '9999999999999999aaaaaaaaaaaaaaaa', NU = 'u17620000000009';
  const reg = (db, aid, tok, uid, x) => { const b = writeBatch(db);
    b.set(doc(db, 'checkinUsers/' + uid), { uid: uid, name: '見本 みどり', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', cardToken: tok, active: true, visits: 1, firstEv: 'ev1', lastEv: 'ev1', lastAt: 1, createdAt: 1, createdBy: 'staff1', byName: '受付 係' });
    b.set(doc(db, 'cards/' + tok), { kind: 'user', no: uid, name: '見本 みどり', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', active: true, visits: 1, createdAt: 1 });
    b.set(doc(db, 'cardClaims/' + uid), { t: tok });
    b.update(doc(db, 'ckApply/' + aid), Object.assign({ st: 'done', tok: tok, uid: uid, doneAt: serverTimestamp(), by: 'staff1', name: '見本 みどり', refName: '架空 太郎', refNo: 'ZZ0001' }, x));
    return b.commit(); };
  c('ログインしていない人は done にできない', !(await ok(updateDoc(doc(anon, 'ckApply/' + AID), { st: 'done', tok: TOKU, uid: 'u17620000000001', by: 'x' }))));
  c('無効のアカウントは done にできない', !(await ok(reg(off, AID, NT, NU, { by: 'off1' }))));
  c('カードを作らずに done にはできない', !(await ok(updateDoc(doc(staff, 'ckApply/' + AID), { st: 'done', tok: NT, uid: NU, by: 'staff1' }))));
  c('ほかのユーザーのカードでは done にできない', !(await ok(updateDoc(doc(staff, 'ckApply/' + AID), { st: 'done', tok: TOKU, uid: NU, by: 'staff1' }))));
  c('受付の人は、ユーザーの登録と一緒に done にできる', await ok(reg(staff, AID, NT, NU, {})));
  c('2回目（ほかの端末から同じ受付票）は、ユーザーの登録ごと弾かれる', !(await ok(reg(staff, AID, 'aaaaaaaaaaaaaaaa9999999999999999', 'u17620000000010', {}))));
  const second = (await getDoc(doc(staff, 'cardClaims/u17620000000010'))).exists();
  const doneTok = (await getDoc(doc(anon, 'ckApply/' + AID))).data().tok;
  c('2回目の登録は入っていない（名簿にない）', !second);
  c('done になった申し込みに、本人のカードが入っている', doneTok === NT);

  // 確認メンバーの設定（会員証に出す番号）
  const owner = env.authenticatedContext('j2DPDAccCygHmR9i5K3bTvHnH0V2').firestore();
  c('オーナーは会員証に出す番号（cardNos）も保存できる', await ok(setDoc(doc(owner, 'checkinConfig/beauty'), { testers: ['staff1'], cardNos: ['ZZ0001'], by: 'j2DPDAccCygHmR9i5K3bTvHnH0V2', at: serverTimestamp() })));
  c('ほかの人は保存できない', !(await ok(setDoc(doc(staff, 'checkinConfig/beauty'), { testers: ['staff1'], cardNos: ['ZZ0001'], by: 'staff1', at: serverTimestamp() }))));
  c('会員証（ログインなし）から設定を読める', await ok(getDoc(doc(anon, 'checkinConfig/beauty'))));

  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
