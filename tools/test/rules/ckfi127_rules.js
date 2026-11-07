// 受付 v127（友だちの招待リンク: ckJoin の kind=friend・ckApply の招待した人・ユーザーの名簿の invUid）の firestore.rules を、
// Firestore エミュレータで試す（架空のデータだけ）。準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, writeBatch, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TU = 'abababababababababababababababab', TTR = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', TM = '0123456789abcdef0123456789abcdef', TOFF = 'efefefefefefefefefefefefefefefef';
const UID = 'u17620000000001', UTR = 'u17620000000002', UOFF = 'u17620000000003';
const FK = 'f_abcdefghijkmnpqrstuv', FK2 = 'f_bbbbbbbbbbbbbbbbbbbb', FK3 = 'f_cccccccccccccccccccc', AID = 'abcdefghijkmnpqrstuvwxyz', AID2 = 'bcdefghijkmnpqrstuvwxyz2';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'fi-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/staff1'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'cards/' + TU), { kind: 'user', no: UID, name: '見本 はなこ', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', active: true });
    await setDoc(doc(d, 'cardClaims/' + UID), { t: TU });
    await setDoc(doc(d, 'cards/' + TTR), { kind: 'user', no: UTR, name: '見本 研修', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', active: true, toMember: 'P0006' });
    await setDoc(doc(d, 'cardClaims/' + UTR), { t: TTR });
    await setDoc(doc(d, 'cards/' + TOFF), { kind: 'user', no: UOFF, name: '見本 無効', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', active: false });
    await setDoc(doc(d, 'cardClaims/' + UOFF), { t: TOFF });
    await setDoc(doc(d, 'cards/' + TM), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true });
    await setDoc(doc(d, 'cardClaims/ZZ0001'), { t: TM });
    await setDoc(doc(d, 'ckJoin/v_ev1'), { kind: 'venue', union: 'U1', evId: 'ev1', by: 'staff1' });
    await setDoc(doc(d, 'ckJoin/r_eeeeeeeeeeeeeeeeeeee'), { kind: 'ref', union: 'U1', refNo: 'ZZ0001', refName: '架空 太郎' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const staff = env.authenticatedContext('staff1').firestore();
  const F = (x) => Object.assign({ kind: 'friend', union: 'U1', refNo: 'ZZ0001', refName: '架空 太郎', invUid: UID, invName: '見本 はなこ', at: serverTimestamp() }, x);
  const fb = (tok, key, x) => { const b = writeBatch(anon);
    b.set(doc(anon, 'cards/' + tok + '/join/me'), { k: key, at: serverTimestamp() });
    b.set(doc(anon, 'ckJoin/' + key), F(x)); return b.commit(); };

  // 友だちの招待リンク（ユーザーのカードから・ログインなし）
  c('紹介者を変えては作れない', !(await ok(fb(TU, FK2, { refName: '別の人' }))));
  c('紹介者の番号を変えては作れない', !(await ok(fb(TU, FK2, { refNo: 'ZZ0009' }))));
  c('ほかのユーザーの名前では作れない', !(await ok(fb(TU, FK2, { invName: '別の人' }))));
  c('研修生になったユーザーのカードからは作れない', !(await ok(fb(TTR, FK3, { invUid: UTR, invName: '見本 研修' }))));
  c('無効のユーザーのカードからは作れない', !(await ok(fb(TOFF, FK3, { invUid: UOFF, invName: '見本 無効' }))));
  c('ビジネスの会員証から友だちのリンク（f_）は作れない', !(await ok(fb(TM, FK3, { invUid: 'ZZ0001', invName: '架空 太郎' }))));
  c('ユーザーのカードの本人は、友だちの招待リンクを作れる', await ok(fb(TU, FK, {})));
  c('ユーザーのカードから紹介者のQR（r_）は作れない', !(await ok((() => { const b = writeBatch(anon);
    b.set(doc(anon, 'cards/' + TTR + '/join/me'), { k: 'r_dddddddddddddddddddd', at: serverTimestamp() });
    b.set(doc(anon, 'ckJoin/r_dddddddddddddddddddd'), { kind: 'ref', union: 'U1', refNo: UTR, refName: '見本 研修', at: serverTimestamp() }); return b.commit(); })())));
  c('招待リンクは書き換えられない', !(await ok(setDoc(doc(anon, 'ckJoin/' + FK), F({ invName: '見本 はなこ' })))));

  // 招待リンクから申し込む
  const A = (x) => Object.assign({ join: FK, name: '見本 さくら', kana: '', union: 'U1', refNo: 'ZZ0001', refName: '架空 太郎', invUid: UID, invName: '見本 はなこ', evId: '', ok: true, st: 'wait', at: serverTimestamp() }, x);
  c('招待した人を変えては申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ invName: '別の人' })))));
  c('招待した人を消しては申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ invUid: '', invName: '' })))));
  c('紹介者を変えては申し込めない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ refName: '別の人' })))));
  c('招待リンクから申し込める（紹介者・招待した人つき）', await ok(setDoc(doc(anon, 'ckApply/' + AID), A())));
  c('会場のQRの申し込みに、招待した人は入れられない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ join: 'v_ev1', refNo: '', evId: 'ev1' })))));
  c('紹介者のQRの申し込みに、招待した人は入れられない', !(await ok(setDoc(doc(anon, 'ckApply/' + AID2), A({ join: 'r_eeeeeeeeeeeeeeeeeeee' })))));

  // 受付で登録（ユーザーの名簿に招待した人・招待した人のカードに「来てくれた」）
  const NT = '9999999999999999aaaaaaaaaaaaaaaa', NU = 'u17620000000009';
  const b = writeBatch(staff);
  b.set(doc(staff, 'checkinUsers/' + NU), { uid: NU, name: '見本 さくら', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', cardToken: NT, active: true, visits: 1, firstEv: 'ev1', lastEv: 'ev1', lastAt: 1, createdAt: 1, createdBy: 'staff1', byName: '受付 係', invUid: UID, invName: '見本 はなこ' });
  b.set(doc(staff, 'cards/' + NT), { kind: 'user', no: NU, name: '見本 さくら', union: 'U1', referrer: '架空 太郎', referrerNo: 'ZZ0001', active: true, visits: 1, createdAt: 1 });
  b.set(doc(staff, 'cardClaims/' + NU), { t: NT });
  b.set(doc(staff, 'cards/' + TU), { ['inv_' + NU]: { n: '見本 さくら', d: '2026-12-07', ev: '12月のDAY' } }, { merge: true });
  b.update(doc(staff, 'ckApply/' + AID), { st: 'done', tok: NT, uid: NU, doneAt: serverTimestamp(), by: 'staff1', name: '見本 さくら', refName: '架空 太郎', refNo: 'ZZ0001' });
  c('受付の人は、招待した人つきでユーザーを登録し、招待した人のカードに「来てくれた」を入れられる', await ok(b.commit()));
  c('招待した人のカード（ログインなしで読める）に「来てくれた」が入っている', ((await getDoc(doc(anon, 'cards/' + TU))).data()['inv_' + NU] || {}).n === '見本 さくら');
  c('ログインしていない人は、カードに「来てくれた」を書けない', !(await ok(setDoc(doc(anon, 'cards/' + TU), { inv_x: { n: 'x' } }, { merge: true }))));

  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
