// 受付 v124：会員証から本人として送る4つの書き込み（セルフチェックイン・オンライン受講申請・予約・取消申請）は、
//   ログインしていない別の接続（ckAnonDb）で送る。NAVIGATOR・ATTACK LIST に別のアカウントでログインしたままのスマホだと
//   ルールが「ログインした人」として判定して「申請できません」になっていた（ルールの確かめは tools/test/rules/ckol124_rules.js）
const fs = require('fs'), path = require('path');
const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const slice = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('slice ' + a); return H.slice(i, j); };
(async () => {
  const W = new JSDOM('', { runScripts: 'outside-only' }).window;
  const src = slice('var gAnonDb = null;', '/* ---------- utils ---------- */');
  W.eval('var made = []; var db = { name: "default" }; var firebaseConfig = { projectId: "x" };'
    + 'var firebase = { apps: [{ name: "[DEFAULT]" }], initializeApp: function(cfg, nm){ var a = { name: nm, firestore: function(){ return { name: "anon:" + nm }; } }; made.push(nm); firebase.apps.push(a); return a; } };'
    + src);
  c('別の名前（cardAnon）の接続を作って使う', W.ckAnonDb().name === 'anon:cardAnon' && W.made.join() === 'cardAnon');
  W.ckAnonDb();
  c('2回目からは作らずに使い回す', W.made.length === 1);
  const W2 = new JSDOM('', { runScripts: 'outside-only' }).window;
  W2.eval('var db = { name: "default" }; var firebaseConfig = {}; var firebase = { apps: [], initializeApp: function(){ throw new Error("x"); } };' + src);
  c('作れない時はいつもの接続で送る（今までと同じ）', W2.ckAnonDb().name === 'default');
  const n = (re) => (H.match(re) || []).length;
  c('セルフチェックインは ckAnonDb で送る', n(/ckAnonDb\(\)\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('attendance'\)\.doc\(c\.no\)\.set\(\{\n\s+no: c\.no, name: c\.name \|\| '', group: c\.group \|\| '', union: c\.union \|\| '',\n\s+method: 'self'/g) === 1);
  c('オンライン受講申請は ckAnonDb で送る', n(/ckAnonDb\(\)\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('attendance'\)\.doc\(c\.no\)\.set\(\{\n\s+no: c\.no, name: c\.name \|\| '', group: c\.group \|\| '', union: c\.union \|\| '',\n\s+method: 'online'/g) === 1);
  c('予約は ckAnonDb で送る', n(/ckAnonDb\(\)\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('rsvps'\)/g) === 1);
  c('予約の取消申請は ckAnonDb で送る', n(/ckAnonDb\(\)\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('rsvpCancels'\)/g) === 1);
  c('会員証の cardToken: gCardToken 付きの出席・予約の書き込みが、ふつうの db に残っていない',
    !/[^A-Za-z]db\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('(rsvps|rsvpCancels)'\)\.doc\(c\.no\)\.set/.test(H)
    && !/[^A-Za-z]db\.collection\('checkinEvents'\)\.doc\(ev\.id\)\.collection\('attendance'\)\.doc\(c\.no\)\.set/.test(H));
  c('失敗した時は受付担当への確認を案内する', /申請できません。すでに申請済みか、受付で登録済みの可能性があります。会員番号を受付担当に伝えて確認してください。/.test(H));
  c('APP_VER v124以降・v124のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 124 && /\n  \{ v: 'v124', d: '2026\/11\/05'/.test(H));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
