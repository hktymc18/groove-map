// 受付 v146：サーバーのプログラム（functions/beauty.js）。前日のお知らせに体感（メニュー・担当・順番）を入れる・
//   DAY のあと30日たった参加申し込みと、担当の会員証の事前情報を消す。にせのデータベースで試す（架空データ・本物には送らない）
const path = require('path');
const B = require(path.join(__dirname, '../../../functions/beauty.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const T32 = (ch) => ch.repeat(32), DEL = { __del: true };
function fakeDb(store) {
  const snap = (p) => ({ id: p.split('/').pop(), exists: store[p] !== undefined, data: () => store[p] && JSON.parse(JSON.stringify(store[p])), ref: ref(p) });
  const ref = (p) => ({ path: p, id: p.split('/').pop(), get: async () => snap(p),
    set: async (d, o) => { store[p] = o && o.merge ? Object.assign({}, store[p] || {}, d) : d; },
    update: async (d) => { if (!store[p]) throw new Error('no doc'); Object.keys(d).forEach((k) => { if (d[k] === DEL) delete store[p][k]; else store[p][k] = d[k]; }); },
    delete: async () => { delete store[p]; }, collection: (n) => col(p + '/' + n) });
  const cmp = (a, op, b) => op === '==' ? a === b : op === '<' ? a < b : op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : false;
  const col = (p, fs, lim) => ({
    doc: (id) => ref(p + '/' + id),
    where: (f, op, v) => col(p, (fs || []).concat([[f, op, v]]), lim),
    limit: (n) => col(p, fs, n),
    get: async () => ({ docs: Object.keys(store).filter((k) => k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0)
      .filter((k) => (fs || []).every(([f, op, v]) => cmp(store[k][f], op, v))).slice(0, lim || 1e9).map(snap) })
  });
  return { collection: (n) => col(n) };
}
function fakeMsg() { const sent = []; return { sent, sendEach: async (msgs) => { msgs.forEach((m) => sent.push(m)); return { responses: msgs.map(() => ({ success: true })) }; } }; }
(async () => {
  const now = Date.UTC(2026, 11, 6, 10, 0); // 日本時間 2026-12-06 19:00
  // ① 前日のお知らせに体感
  const store = {
    'checkinEvents/e1': { date: '2026-12-07', name: '12月のDAY', unions: ['U1'], uDay: true, uInfo: '19:00〜 見本ホール' },
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },
    'ckPush/u2': { card: T32('b'), union: 'U1', t: 'tok2', on: true },
    'ckPush/u3': { card: T32('c'), union: 'U1', t: 'tok3', on: true },
    ['cards/' + T32('a')]: { kind: 'user', exp_e1: { menu: 'ルミスパ', staff: '見本 えきすぱ', ord: 2, st: 'rsv' } },
    ['cards/' + T32('b')]: { kind: 'user' },
    ['cards/' + T32('c')]: { kind: 'user', exp_e1: { menu: 'ウェルスパ', staff: '', ord: 0, st: 'rsv' } } };
  const m = fakeMsg();
  const r = await B.dayEve(fakeDb(store), m, now);
  const body = (t) => (m.sent.find((x) => x.token === t) || { webpush: { notification: {} } }).webpush.notification.body;
  c('体感がある人：「体感：ルミスパ（担当・順番）」が先頭', /^体感：ルミスパ（担当 見本 えきすぱ・2番目）。19:00〜 見本ホール。/.test(body('tok1')), body('tok1'));
  c('担当がまだの人：メニューだけ', /^体感：ウェルスパ。19:00〜/.test(body('tok3')), body('tok3'));
  c('体感がない人：今までどおり', /^19:00〜 見本ホール。カードを開いて/.test(body('tok2')), body('tok2'));
  c('3人に送る（文がちがう人ごとにまとめる）', r.sent === 3 && m.sent.length === 3, JSON.stringify(r));
  // ② 30日たった申し込みと事前情報を消す
  const s2 = {
    'ckReq/oldoldoldoldoldold01': { date: '2026-11-01', eid: 'eo', union: 'U1', name: '見本 まえ' },
    'ckReqProof/oldoldoldoldoldold01': { tk: T32('r'), at: 1 },
    ['cards/' + T32('r') + '/dreq/oldoldoldoldoldold01']: { at: 1 },
    'ckReq/newnewnewnewnewnew01': { date: '2026-11-20', eid: 'en', union: 'U1', name: '見本 いま' },
    'ckReqProof/newnewnewnewnewnew01': { tk: T32('r'), at: 1 },
    'checkinEvents/eo': { date: '2026-11-01', unions: ['U1'] },
    'checkinEvents/eo/btDay/U1': { staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }] },
    'checkinEvents/en': { date: '2026-11-20', unions: ['U1'] },
    'checkinEvents/en/btDay/U1': { staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }] },
    'checkinMembers/ANT0001': { cardToken: T32('s') },
    ['cards/' + T32('s')]: { no: 'ANT0001', btp_eo: { p1: { goal: '肌のくすみ' } }, btp_en: { p2: { goal: '保湿' } } } };
  const out = await B.cleanup(fakeDb(s2), now, DEL);
  c('30日より前の申し込み・本人の印・紹介者の印を消す', !s2['ckReq/oldoldoldoldoldold01'] && !s2['ckReqProof/oldoldoldoldoldold01'] && !s2['cards/' + T32('r') + '/dreq/oldoldoldoldoldold01'] && out.reqs === 1, JSON.stringify(out));
  c('30日たっていない申し込みは残す', !!s2['ckReq/newnewnewnewnewnew01'] && !!s2['ckReqProof/newnewnewnewnewnew01']);
  c('担当の会員証の事前情報：30日より前の DAY の分だけ消す', !s2['cards/' + T32('s')].btp_eo && !!s2['cards/' + T32('s')].btp_en, JSON.stringify(s2['cards/' + T32('s')]));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
