// 受付 v129：サーバーのプログラム（functions/beauty.js）。DAYの前日のお知らせ・来場のお礼を、通知を受け取っているユーザーにだけ送る。
//   にせのデータベースと送信の仕組みで試す（架空データ・本物には送らない）
const path = require('path');
const B = require(path.join(__dirname, '../../../functions/beauty.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const T32 = (ch) => ch.repeat(32);
function fakeDb(store) {
  const snap = (p) => ({ id: p.split('/').pop(), exists: store[p] !== undefined, data: () => store[p] && JSON.parse(JSON.stringify(store[p])), ref: ref(p) });
  const ref = (p) => ({ path: p, id: p.split('/').pop(), get: async () => snap(p), set: async (d, o) => { store[p] = o && o.merge ? Object.assign({}, store[p] || {}, d) : d; },
    collection: (n) => col(p + '/' + n) });
  const col = (p, fs) => ({
    doc: (id) => ref(p + '/' + id),
    where: (f, op, v) => col(p, (fs || []).concat([[f, v]])),
    get: async () => ({ docs: Object.keys(store).filter((k) => k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0)
      .filter((k) => (fs || []).every(([f, v]) => store[k][f] === v)).map(snap) })
  });
  return { collection: (n) => col(n) };
}
function fakeMsg(bad) {
  const sent = [];
  return { sent, sendEach: async (msgs) => { msgs.forEach((m) => sent.push(m)); return { responses: msgs.map((m) => bad && m.token === bad ? { success: false, error: { code: 'messaging/registration-token-not-registered' } } : { success: true }) }; } };
}
(async () => {
  const now = Date.UTC(2026, 11, 6, 10, 0); // 日本時間 2026-12-06 19:00
  c('日本時間の日付（今日・明日）', B.jstYmd(now, 0) === '2026-12-06' && B.jstYmd(now, 1) === '2026-12-07' && B.jstYmd(Date.UTC(2026, 11, 6, 16, 0), 0) === '2026-12-07');
  const store = {
    'checkinEvents/e1': { date: '2026-12-07', name: '12月のDAY', unions: ['U1', 'U2'], uDay: true, uInfo: '13:00〜 見本ホール' },
    'checkinEvents/e2': { date: '2026-12-07', name: '研修（ビジネスだけ）', unions: ['U1'] },
    'checkinEvents/e3': { date: '2026-12-08', name: 'あさってのDAY', unions: ['U1'], uDay: true },
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },
    'ckPush/u2': { card: T32('b'), union: 'U2', t: 'tok2', on: true },
    'ckPush/u3': { card: T32('c'), union: 'U1', t: 'tok3', on: false },
    'ckPush/u4': { card: T32('d'), union: 'U9', t: 'tok4', on: true },
    'ckPush/u5': { card: T32('e'), union: 'U1', t: 'tokBad', on: true }
  };
  const db = fakeDb(store), m = fakeMsg('tokBad');
  const r = await B.dayEve(db, m, now);
  const toks = m.sent.map((x) => x.token).sort().join(',');
  c('前日のお知らせ：明日の「次のDAYとして出す」イベントの、参加ユニオンでオンの人だけ', toks === 'tok1,tok2,tokBad' && r.events === 1, toks + ' ' + JSON.stringify(r));
  const m1 = m.sent.find((x) => x.token === 'tok1');
  c('文面：「明日は12月のDAYです」・時間と場所・カードを開くリンク', m1.webpush.notification.title === '明日は12月のDAYです' && /13:00〜 見本ホール。カードを開いて/.test(m1.webpush.notification.body)
    && m1.webpush.fcmOptions.link === B.CARD + T32('a') && m1.data.url === B.CARD + T32('a'), JSON.stringify(m1));
  c('届かなくなった宛先はオフにする', store['ckPush/u5'].on === false && store['ckPush/u1'].on === true);
  c('ビジネスだけのイベント・あさってのイベントでは送らない', !m.sent.some((x) => /研修|あさって/.test(x.webpush.notification.title)));
  // 来場のお礼
  const s2 = {
    'checkinEvents/t1': { date: '2026-12-06', name: '12月のDAY', unions: ['U1'] },
    'checkinEvents/t1/attendance/u1': { kind: 'user', name: '見本 はなこ' },
    'checkinEvents/t1/attendance/u3': { kind: 'user', name: '見本 さくら' },
    'checkinEvents/t1/attendance/u6': { kind: 'user', name: '見本 ゆり' },
    'checkinEvents/t1/attendance/P001': { name: 'ビジネスの人' },
    'checkinEvents/t2': { date: '2026-12-06', name: '午後のDAY', unions: ['U1'] },
    'checkinEvents/t2/attendance/u1': { kind: 'user', name: '見本 はなこ' },
    'checkinEvents/old': { date: '2026-12-01', name: '前のDAY', unions: ['U1'] },
    'checkinEvents/old/attendance/u2': { kind: 'user' },
    'ckPush/u1': { card: T32('a'), union: 'U1', t: 'tok1', on: true },
    'ckPush/u2': { card: T32('b'), union: 'U1', t: 'tok2', on: true },
    'ckPush/u3': { card: T32('c'), union: 'U1', t: 'tok3', on: false },
    'ckPush/P001': { card: T32('f'), union: 'U1', t: 'tokP', on: true }
  };
  const m2 = fakeMsg();
  const r2 = await B.thanks(fakeDb(s2), m2, now);
  c('来場のお礼：今日受付したユーザーで、オンの人に1回だけ（2つのイベントに来ても1通）', m2.sent.map((x) => x.token).join(',') === 'tok1' && r2.users === 3, JSON.stringify(r2) + ' ' + m2.sent.map((x) => x.token));
  c('お礼の文面とリンク', m2.sent[0].webpush.notification.title === 'ご来場ありがとうございました' && m2.sent[0].webpush.fcmOptions.link === B.CARD + T32('a'));
  const m3 = fakeMsg();
  const r3 = await B.thanks(fakeDb({}), m3, now);
  c('今日イベントがない日は何も送らない', !m3.sent.length && r3.sent === 0);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('exception', e); process.exit(1); });
