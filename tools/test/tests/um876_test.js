// v876：NAVIGATOR Beauty 第3段。ユーザー台帳に DAY の体感（受付のカードの exp_）を取り込む・ショッピング会員の登録・
//   「📝 その後を記録してね」（DAY から3〜90日・記録なし）・その後の要点を受付の集計（ckFollow）へ送る・新機能のテスト bxall で全員に（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
T.run(async () => {
  T.login();
  const day = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return ymd(d); }; setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '', checkinNo: 'A001' })];
  const cus = [{ uid: 'u1', name: '見本 はなこ', union: 'UA', referrerNo: 'A001', cardToken: 'tok1', visits: 1, lastAt: 1, active: true }];
  const cards = { tok1: { kind: 'user', exp_e1: { d: day(-5), ev: '11月のDAY', kind: 'na1', menu: 'ルミスパ', staff: '見本 えきすぱ', ord: 1, st: 'done' }, exp_e0: { d: day(-40), ev: '10月のDAY', kind: 'na0', menu: '', st: 'rsv' } } };
  const writes = [];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.uid || r.id, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({
    where: (f, op, v) => ({ get: () => Promise.resolve(qs(name === 'checkinUsers' ? cus.filter(r => r[f] === v) : [])) }),
    get: () => Promise.resolve(qs(name === 'checkinUnions' ? [{ id: 'UA' }] : [])),
    doc: id => w.db.doc(name + '/' + id)
  });
  w.db.doc = p => ({ get: () => { const k = p.split('/'), d = k[0] === 'checkinConfig' ? { testers: [] } : k[0] === 'cards' ? cards[k[1]] : null; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)) }); },
    set: (d) => { writes.push([p, JSON.parse(JSON.stringify(d))]); return Promise.resolve(); } });
  w.currentUser.union = 'UA'; w.currentUser.uid = 'someone'; w._bxTesters = null;
  // 新機能のテスト（bxall）がオフ → 確認メンバーでない人は取り込まない
  w._featCfg = {};
  c('bxall がオフで確認メンバーでない人は使えない', !w._bxOn());
  w._featCfg = { bxall: { on: true, testers: [] } };
  c('bxall をオンにすると、だれでも使える（ユーザー台帳の受付の取り込み）', w._bxOn());
  w.umCkSync(true); await sleep(100);
  const u = w.state.members.find(m => m.ckNo === 'u1');
  c('DAY の体感（新しい順・区分・メニュー・担当・済み）が台帳に入る', u && u.uDays && u.uDays.length === 2 && u.uDays[0].menu === 'ルミスパ' && u.uDays[0].staff === '見本 えきすぱ' && u.uDays[0].st === 'done' && u.uDays[0].e === 'e1', JSON.stringify(u && u.uDays));
  c('「📝 その後」：DAY から5日・記録なし → まだ', w._umFuNeed(u) === true);
  const fw = writes.filter(x => /^ckFollow\//.test(x[0]));
  c('取り込みのあと、受付の集計に要点を送る（ユニオン・紹介者の番号・名前・まだ何もない）', fw.length === 1 && fw[0][0] === 'ckFollow/u1' && fw[0][1].union === 'UA' && fw[0][1].refNo === 'A001' && fw[0][1].name === '見本 はなこ' && fw[0][1].shop === '' && fw[0][1].buy1 === '' && fw[0][1].adp === false && fw[0][1].by === 'someone', JSON.stringify(fw));
  // 一覧
  w._umMode = true; w._umRef = ''; w._umFlt = 'all'; w.switchView('current'); await sleep(60);
  let tx = (w.document.getElementById('treeCurrent') || {}).textContent || '';
  c('一覧に体感（日付・メニュー・担当・済み）と「📝 その後を記録してね」・絞り込み「その後がまだ 1」', /\d+\/\d+ ルミスパ（見本 えきすぱ） 済み/.test(tx) && /その後を記録してね/.test(tx) && /その後がまだ 1/.test(tx), tx.slice(0, 500));
  // ショッピング会員の登録 → 送る（変わった時だけ）
  w._umTgt = () => u;
  w.umShopSet(1); await sleep(30);
  let f2 = writes.filter(x => x[0] === 'ckFollow/u1');
  c('会員登録「した」→ その後はもう「まだ」ではない・受付へ送る（登録した日）', !w._umFuNeed(u) && f2.length === 2 && f2[1][1].shop === u.shopReg.d && /^\d{4}-\d{2}-\d{2}$/.test(u.shopReg.d), JSON.stringify(f2[1]));
  w.umShopDate(day(-2)); await sleep(30);
  u.buys = [{ t: '見本の美容液', d: day(-1), amt: 4500 }]; w.umAdpSet(1); await sleep(30);
  f2 = writes.filter(x => x[0] === 'ckFollow/u1');
  const last = f2[f2.length - 1][1];
  c('初めての購入・ADP も送る（購入の数・金額）', last.buy1 === day(-1) && last.adp === true && last.nBuy === 1 && last.amt === 4500 && last.shop === day(-2), JSON.stringify(last));
  const n0 = writes.length; w._umFuPush(u); await sleep(20);
  c('変わっていなければ送らない', writes.length === n0);
  // 「その後」の判定
  const v = (o) => w._umFuNeed(Object.assign({ uDays: [{ d: day(-5), st: 'done', menu: 'ルミスパ' }], buys: [], adp: { on: false } }, o));
  c('DAY から2日なら、まだ出さない', !v({ uDays: [{ d: day(-2), st: 'done', menu: 'ルミスパ' }] }));
  c('来なかった DAY・91日より前の DAY では出さない', !v({ uDays: [{ d: day(-5), st: 'absent' }] }) && !v({ uDays: [{ d: day(-91), st: 'done' }] }));
  c('DAY のあとの購入があれば出さない・前の購入だけなら出す', !v({ buys: [{ t: 'x', d: day(-1) }] }) && v({ buys: [{ t: 'x', d: day(-20) }] }));
  c('APP_JS_VERSION v876 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 876);
});
