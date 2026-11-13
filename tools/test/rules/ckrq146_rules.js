// 受付 v146（DAYの参加申し込み: ckReq・ckReqProof・cards/{t}/dreq・ckDayPub）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, writeBatch, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TR = 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', TO = 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2', TU = 'c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3';
const R1 = 'rrrrrrrrrrrrrrrrrrr1', R2 = 'rrrrrrrrrrrrrrrrrrr2';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'rq-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', dayStaff: ['host1'] });
    await setDoc(doc(d, 'users/host1'), { union: 'U2', status: 'active' });
    await setDoc(doc(d, 'users/recv1'), { union: 'U1', status: 'active', ckNo: 'ANT0004' });
    await setDoc(doc(d, 'users/mem1'), { union: 'U1', status: 'active', ckNo: 'ANT0009' });
    await setDoc(doc(d, 'checkinEvents/evD'), { date: '2026-12-14', name: '12月のDAY', unions: ['U1'], hostUnion: 'U1' });
    await setDoc(doc(d, 'checkinEvents/evD/btDay/U1'), { union: 'U1', key: 'k1k1k1k1k1k1k1k1k1k1', staff: [], recv: [{ no: 'ANT0004', name: '見本 うけつけ' }], recvNos: ['ANT0004'] });
    await setDoc(doc(d, 'cards/' + TR), { no: 'ANT0002', name: '見本 しょうかい', union: 'U1', active: true });
    await setDoc(doc(d, 'cards/' + TO), { no: 'ANT0007', name: '見本 ほかのひと', union: 'U1', active: true });
    await setDoc(doc(d, 'cards/' + TU), { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'U1', active: true });
  });
  const anon = env.unauthenticatedContext().firestore(), as = u => env.authenticatedContext(u).firestore();
  const Q = (x) => Object.assign({ eid: 'evD', union: 'U1', date: '2026-12-14', ev: '12月のDAY', refNo: 'ANT0002', refName: '見本 しょうかい', kind: 'na1', name: '見本 みどり',
    age: '30代', sex: '女性', upRuby: '', attendBa: '見本 つきそい', menu: 'ルミスパ', w1: '', w2: '', mist: false, goal: '肌のくすみ', job: '会社員', rel: '友人', times: '初回',
    status: 'NA（NS説明前）', items: '', why: '', talk: '', next: '', st: 'new', note: '', pid: '', at: 1, upAt: 1 }, x || {});
  const send = (rid, tk, data, mark) => { const b = writeBatch(anon); b.set(doc(anon, 'ckReq/' + rid), data); b.set(doc(anon, 'ckReqProof/' + rid), { tk, at: serverTimestamp() }); if (mark) b.set(doc(anon, 'cards/' + mark + '/dreq/' + rid), { at: serverTimestamp() }); return b.commit(); };
  c('紹介者（会員証・ログインなし）は申し込める（本人の印・紹介者の印と一緒）', await ok(send(R1, TR, Q(), TR)));
  c('ほかの人の会員証では、その人の名前（紹介者）で申し込めない', !(await ok(send(R2, TO, Q(), TO))));
  c('ユーザーのカードからは申し込めない', !(await ok(send(R2, TU, Q({ refNo: 'u1' }), TU))));
  c('印（トークン）がないと申し込めない', !(await ok(setDoc(doc(anon, 'ckReq/' + R2), Q()))));
  c('はじめから「確認済み」では申し込めない', !(await ok(send(R2, TR, Q({ st: 'ok' }), TR))));
  c('決まった項目以外は入れられない', !(await ok(send(R2, TR, Q({ memo: 'x' }), TR))));
  c('参加ユニオンでない DAY には申し込めない', !(await ok(send(R2, TR, Q({ union: 'U9' }), null))));
  c('ほかの人の会員証に、自分の申し込みの印は付けられない', !(await ok((() => { const b = writeBatch(anon); b.set(doc(anon, 'cards/' + TO + '/dreq/' + R1), { at: serverTimestamp() }); return b.commit(); })())));
  c('紹介者は申し込みを1件ずつ読める（キー）・本人の印は読めない', await ok(getDoc(doc(anon, 'ckReq/' + R1))) && !(await ok(getDoc(doc(anon, 'ckReqProof/' + R1)))));
  c('ログインなしで申し込みの一覧は見られない', !(await ok(getDocs(query(collection(anon, 'ckReq'), where('eid', '==', 'evD'), where('union', '==', 'U1'))))));
  c('紹介者は受付中のあいだ直せる', await ok(send(R1, TR, Q({ attendBa: '見本 つきそい太郎' }))));
  c('ほかの人の会員証では直せない', !(await ok(send(R1, TO, Q({ attendBa: 'x' })))));
  const L = (u) => getDocs(query(collection(as(u), 'ckReq'), where('eid', '==', 'evD'), where('union', '==', 'U1')));
  c('予約受付担当（ログイン・その DAY に任命）は一覧を読める', await ok(L('recv1')));
  c('DAY HOST は一覧を読める', await ok(L('host1')));
  c('ふつうのメンバーは一覧を読めない', !(await ok(L('mem1'))));
  c('予約受付担当は確認済みにできる', await ok(updateDoc(doc(as('recv1'), 'ckReq/' + R1), { st: 'ok', chkBy: 'recv1', chkName: '見本 うけつけ', chkAt: 2, upAt: 2 })));
  c('紹介者は確認済みのあとは直せない', !(await ok(send(R1, TR, Q({ attendBa: 'y' })))));
  c('予約受付担当でも、紹介者・DAY は変えられない', !(await ok(updateDoc(doc(as('recv1'), 'ckReq/' + R1), { refNo: 'ANT0007' }))));
  c('ふつうのメンバーは確かめられない', !(await ok(updateDoc(doc(as('mem1'), 'ckReq/' + R1), { st: 'ng' }))));
  c('決まっていない状態（st）にはできない', !(await ok(updateDoc(doc(as('recv1'), 'ckReq/' + R1), { st: 'gone' }))));
  // 窓口
  const PUB = { union: 'U1', eid: 'evD', date: '2026-12-14', ev: '12月のDAY', staff: ['見本 えきすぱ'], menus: ['ルミスパ'], open: true, by: 'host1', at: 1 };
  c('DAY HOST は窓口を開ける・ふつうのメンバーは開けない', await ok(setDoc(doc(as('host1'), 'ckDayPub/evD_U1'), PUB)) && !(await ok(setDoc(doc(as('mem1'), 'ckDayPub/evD_U1'), PUB))));
  c('窓口の名前（イベント_ユニオン）が合わないと作れない', !(await ok(setDoc(doc(as('host1'), 'ckDayPub/other_U1'), PUB))));
  c('会員証（ログインなし）は窓口を読める', await ok(getDoc(doc(anon, 'ckDayPub/evD_U1'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
