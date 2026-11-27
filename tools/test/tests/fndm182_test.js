// 受付 v182：相談の通知と数のまとめ（functions/dm.js）。にせのデータベースと送信の仕組み（架空データ）
//   お客さん → スタッフ：スタッフの NAVIGATOR の端末に通知・会員証に最後に相談した日（分野・中身は入れない）
//   スタッフ → お客さん：お客さんの端末に通知・最初の返事の時刻。止められていたら送らない。通知に中身は入れない
//   毎日：ユニオンごとの数（30日・分野・最初の返事まで・報告）
const path = require('path');
const D = require(path.join(__dirname, '../../../functions/dm.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
function fakeDb(store) {
  const cp = (d) => d === undefined ? undefined : JSON.parse(JSON.stringify(d));
  const snap = (p) => ({ id: p.split('/').pop(), exists: store[p] !== undefined, data: () => cp(store[p]), ref: ref(p) });
  const ref = (p) => ({ path: p, id: p.split('/').pop(), get: async () => snap(p),
    set: async (d, o) => { store[p] = o && o.merge ? Object.assign({}, store[p] || {}, cp(d)) : cp(d); }, delete: async () => { delete store[p]; },
    collection: (n) => col(p + '/' + n) });
  const col = (p, fs) => ({ doc: (id) => ref(p + '/' + id), where: (f, op, v) => col(p, (fs || []).concat([[f, v]])),
    get: async () => ({ docs: Object.keys(store).filter((k) => k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0).filter((k) => (fs || []).every(([f, v]) => store[k][f] === v)).map(snap) }) });
  return { collection: (n) => col(n) };
}
function fakeMsg(bad) { const sent = []; return { sent, sendEach: async (ms) => { ms.forEach((m) => sent.push(m)); return { responses: ms.map((m) => (bad && m.token === bad ? { success: false, error: { code: 'messaging/registration-token-not-registered' } } : { success: true })) }; } }; }
(async () => {
  const TK = 'a'.repeat(32), now = Date.UTC(2026, 10, 26, 3, 0);
  const th = (x) => Object.assign({ tk: TK, un: 'REVE', cname: '見本 はなこ', sUid: 'st1', sName: '見本 りな', topic: 'bust', st: 'open', at: now - 3600000, byStaff: false }, x || {});
  {
    const store = { 'ckDm/t1': th(), 'users/st1/fcmTokens/tokA': { updatedAt: new Date(now).toISOString() }, 'users/st1/fcmTokens/tokOld': { updatedAt: '2020-01-01T00:00:00Z' }, ['cards/' + TK]: { name: '見本 はなこ' } };
    const m = fakeMsg('tokA'), r = await D.onMsg(fakeDb(store), m, 't1', { by: 'u', t: '胸のことで相談です' }, now);
    c('お客さん → スタッフ：スタッフの端末に知らせる（古い端末は送らない）', m.sent.length === 1 && m.sent[0].token === 'tokA', JSON.stringify(m.sent.map((x) => x.token)));
    c('通知には中身を入れない', !/胸/.test(JSON.stringify(m.sent)) && /見本 はなこ さんから相談が届きました/.test(m.sent[0].webpush.notification.body));
    c('届かない端末は消す', !store['users/st1/fcmTokens/tokA']);
    c('会員証には最後に相談した日だけ（分野・中身なし）', store['cards/' + TK].cs && store['cards/' + TK].cs.at === now && Object.keys(store['cards/' + TK].cs).join() === 'at', JSON.stringify(store['cards/' + TK]));
  }
  {
    const store = { 'ckDm/t1': th(), 'ckPush/u1': { card: TK, t: 'tokU', on: true }, 'ckPush/u9': { card: 'b'.repeat(32), t: 'tokX', on: true }, 'ckPush/u2': { card: TK, t: 'tokOff', on: false } };
    const m = fakeMsg(), r = await D.onMsg(fakeDb(store), m, 't1', { by: 's', t: 'クリームを重ねてみてね' }, now);
    c('スタッフ → お客さん：その会員証の通知を受け取っている端末だけ', m.sent.length === 1 && m.sent[0].token === 'tokU', JSON.stringify(m.sent.map((x) => x.token)));
    c('通知は「返事が届きました」だけ・カードを開くリンク', /見本 りな さんから、相談の返事が届きました/.test(m.sent[0].webpush.notification.body) && !/クリーム/.test(JSON.stringify(m.sent)) && m.sent[0].webpush.fcmOptions.link.endsWith('#c=' + TK));
    c('最初の返事の時刻を残す', store['ckDm/t1'].firstS === now);
    await D.onMsg(fakeDb(store), fakeMsg(), 't1', { by: 's', t: '2通目' }, now + 1000);
    c('2通目では最初の返事の時刻を変えない', store['ckDm/t1'].firstS === now);
  }
  {
    // v183：写真が付いていたら、相談に枚数と大きさ（KB）を足す
    const store = { 'ckDm/t1': th({ imgN: 2, imgKB: 200 }) }, img = 'data:image/jpeg;base64,' + 'A'.repeat(136533);
    const r = await D.onMsg(fakeDb(store), fakeMsg(), 't1', { by: 'u', t: '', img }, now);
    c('（v183）写真の枚数と大きさを相談に足す・通知はいつもどおり', store['ckDm/t1'].imgN === 3 && store['ckDm/t1'].imgKB === 300 && r.to === 'staff', JSON.stringify(store['ckDm/t1']));
  }
  {
    const store = { 'ckDm/t1': th({ stop: true }), 'ckPush/u1': { card: TK, t: 'tokU', on: true } };
    const m = fakeMsg(); await D.onMsg(fakeDb(store), m, 't1', { by: 's', t: 'x' }, now);
    c('止められていたら送らない', m.sent.length === 0);
  }
  {
    const day = 86400000;
    const store = {
      'ckDm/a': th({ topic: 'skin', at: now - 2 * day, firstS: now - 2 * day + 60 * 60000 }),
      'ckDm/b': th({ topic: 'skin', at: now - 1 * day, firstS: now - 1 * day + 180 * 60000, st: 'done' }),
      'ckDm/c': th({ topic: 'bust', at: now - 3 * day, rep: { at: now }, stop: true }),
      'ckDm/d': th({ topic: 'inner', at: now - 1 * day, byStaff: true }),
      'ckDm/e': th({ topic: 'skin', at: now - 40 * day, firstS: now - 40 * day + 60000, imgN: 1, imgKB: 120 }),
      'ckDm/f': th({ un: 'ANTARES', topic: 'body', at: now - day, imgN: 4, imgKB: 500 })
    };
    const r = await D.stats(fakeDb(store), now), s = store['ckDmStat/REVE'];
    c('30日の数・分野', s.n30 === 4 && s.topics.skin === 2 && s.topics.bust === 1 && s.topics.inner === 1, JSON.stringify(s));
    c('最初の返事まで（平均・分）・まだ返事のない相談・報告・止められた・先に送った', s.avgFirstMin === 120 && s.noReply === 1 && s.rep === 1 && s.stop === 1 && s.byStaff === 1, JSON.stringify(s));
    c('（v183）写真はこれまでの全部（30日より前も）を数える', s.imgN === 1 && s.imgKB === 120 && store['ckDmStat/ANTARES'].imgN === 4, JSON.stringify([s.imgN, s.imgKB]));
    c('ユニオンごとに分ける・中身は入れない', store['ckDmStat/ANTARES'].n30 === 1 && !/見本/.test(JSON.stringify(store['ckDmStat/REVE'])));
  }
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
