// 受付 v124: 会員証からのオンライン受講申請・セルフ受付・予約を、ログイン中の端末でも試す（架空のデータだけ）
// 準備と起動は ckpf109_rules.js と同じ。
// 会員証のトークンで本人と認めるルールは「ログインしていない時」だけ。NAVIGATOR などに別ユニオン・ユニオン未設定の
// アカウントでログインしたままだと弾かれる（＝実際に起きた不具合）。そのため受付 v124 は、会員証からの4つの書き込みを
// ログインしていない別の接続（ckAnonDb）で送る。ここでは「ログインなしなら通る／ログイン中の別アカウントでは通らない」を確かめる
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'ol-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'cards/tokA'), { no: 'ZZ0001', name: '見本', union: 'U1' });
    await setDoc(doc(d, 'cards/tokB'), { no: 'ZZ0002', name: '見本2', union: 'U9' });
    await setDoc(doc(d, 'checkinEvents/evOl'), { hostUnion: 'U2', unions: ['U2', 'U1'], online: true, date: '2026-11-05' });
    await setDoc(doc(d, 'checkinEvents/evSelf'), { hostUnion: 'U1', unions: ['U1'], mode: 'self', selfOpen: true });
    await setDoc(doc(d, 'checkinEvents/evRsvp'), { hostUnion: 'U1', unions: ['U1'], rsvp: true });
    await setDoc(doc(d, 'users/same'), { union: 'U1', status: 'active' });
    await setDoc(doc(d, 'users/other'), { union: 'U3', status: 'active' });
    await setDoc(doc(d, 'users/blank'), { union: '', status: 'active' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const as = uid => env.authenticatedContext(uid).firestore();
  const A = (tok, o) => Object.assign({ no: 'ZZ0001', union: 'U1', method: 'online', status: 'pending', paid: false, fee: 1000, cardToken: tok, by: 'self-online' }, o);
  const ap = (db, eid, aid, tok, o) => setDoc(doc(db, 'checkinEvents/' + eid + '/attendance/' + aid), A(tok, o));

  // オンライン申請
  c('ログインなしで申請できる', await ok(ap(anon, 'evOl', 'ZZ0001', 'tokA')));
  c('同じ人の2回目（上書き）は出来ない', !(await ok(ap(anon, 'evOl', 'ZZ0001', 'tokA'))));
  c('（原因）別ユニオンのアカウントでログイン中だと弾かれる', !(await ok(ap(as('other'), 'evOl', 'ZZ0004', 'tokA', { no: 'ZZ0004' }))));
  c('（原因）ユニオン未設定のアカウントでログイン中だと弾かれる', !(await ok(ap(as('blank'), 'evOl', 'ZZ0004', 'tokA', { no: 'ZZ0004' }))));
  c('（原因）プロフィールが無いアカウントでログイン中だと弾かれる', !(await ok(ap(as('noprof'), 'evOl', 'ZZ0004', 'tokA', { no: 'ZZ0004' }))));
  // 拒む方
  c('他人の番号には申請できない（トークンと番号が違う）', !(await ok(ap(anon, 'evOl', 'ZZ0002', 'tokA', { no: 'ZZ0002' }))));
  c('参加ユニオンでない会員証では申請できない', !(await ok(ap(anon, 'evOl', 'ZZ0002', 'tokB', { no: 'ZZ0002', union: 'U9' }))));
  c('承認済み（status=approved）で作ることはできない', !(await ok(ap(anon, 'evOl', 'ZZ0003', 'tokA', { no: 'ZZ0003', status: 'approved' }))));
  c('支払済み（paid=true）で作ることはできない', !(await ok(ap(anon, 'evOl', 'ZZ0005', 'tokA', { no: 'ZZ0005', paid: true }))));
  c('オンラインでないイベントには申請できない', !(await ok(ap(anon, 'evRsvp', 'ZZ0001', 'tokA'))));
  // セルフ受付
  const si = (db) => setDoc(doc(db, 'checkinEvents/evSelf/attendance/ZZ0001'), { no: 'ZZ0001', union: 'U1', method: 'self', cardToken: 'tokA' });
  c('（原因）セルフ受付: 別ユニオンのアカウントでログイン中だと弾かれる', !(await ok(si(as('other')))));
  c('セルフ受付: ログインなしなら出来る', await ok(si(anon)));
  // 予約・取消申請
  const rs = (db) => setDoc(doc(db, 'checkinEvents/evRsvp/rsvps/ZZ0001'), { no: 'ZZ0001', union: 'U1', cardToken: 'tokA' });
  c('（原因）予約: 別ユニオンのアカウントでログイン中だと弾かれる', !(await ok(rs(as('other')))));
  c('予約: ログインなしなら出来る', await ok(rs(anon)));
  c('予約の上書きは出来ない', !(await ok(rs(anon))));
  const rc = (db) => setDoc(doc(db, 'checkinEvents/evRsvp/rsvpCancels/ZZ0001'), { no: 'ZZ0001', cardToken: 'tokA' });
  c('（原因）予約の取消申請: 別ユニオンのアカウントでログイン中だと弾かれる', !(await ok(rc(as('other')))));
  c('予約の取消申請: ログインなしなら出来る', await ok(rc(anon)));
  // 受付の通常の権限はそのまま
  c('受付（参加ユニオンのメンバー）は手入力で出席を作れる', await ok(setDoc(doc(as('same'), 'checkinEvents/evOl/attendance/ZZ0009'), { no: 'ZZ0009', method: 'manual' })));
  c('別ユニオンのアカウントはトークン無しで出席を作れない', !(await ok(setDoc(doc(as('other'), 'checkinEvents/evOl/attendance/ZZ0008'), { no: 'ZZ0008', method: 'manual' }))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
