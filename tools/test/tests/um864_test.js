// v864：受付（BASE CHECK-IN）のユーザー（checkinUsers）を、ユーザー台帳に自動で取り込む（NAVIGATOR Beauty 段階4）。
//   紹介者（MAPで受付とつながった人＝checkinNo）の下に入れる。同じ名前のユーザーがいればつなぐ。来場回数・PRYSMiO・会場でのお買い上げも入る。
//   準備中のあいだはオーナーと確認メンバーだけ（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  const fresh = () => [M('r', '架空', '一郎', 'ゴールド', { parentId: '', checkinNo: 'A001' }), M('a', '試験', '二郎', 'B3', { checkinNo: 'A002' }),
    M('ux', '見本', 'さくら', 'ユーザー', { parentId: 'a', ptCurrent: 120, buys: [{ t: '手で入れた記録', d: '2026-10-01' }] })];
  w.state.members = fresh();
  let cus = [
    { uid: 'u1', name: '見本 はなこ', union: 'UA', referrerNo: 'A001', cardToken: 'tok1', visits: 3, lastAt: new Date(2026, 9, 14, 13).getTime(), prysm: 820, prysmAt: 5, active: true },
    { uid: 'u2', name: '見本　さくら', union: 'UA', referrerNo: 'A002', cardToken: 'tok2', visits: 1, lastAt: 1, active: true },
    { uid: 'u3', name: '例題 ゆう', union: 'UA', referrerNo: 'Z999', cardToken: 'tok3', visits: 1, active: true },
    { uid: 'u4', name: '無効 さん', union: 'UA', referrerNo: 'A001', cardToken: 'tok4', visits: 1, active: false }];
  const cards = { tok1: { kind: 'user', rcpt_b_e1: { kind: 'buy', d: '2026-10-14', ev: 'お買い上げ（10月のDAY）', amt: 12000, items: [{ n: '見本の美容液', q: 2, p: 4500 }, { n: '見本のクレンジング', q: 1, p: 3000 }] }, rcpt_e1: { amt: 1000 } }, tok2: { kind: 'user' } };
  let testers = [], reads = [];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.uid || r.id, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({
    where: (f, op, v) => ({ get: () => { reads.push(name + ':' + f + '=' + v); return Promise.resolve(qs(name === 'checkinUsers' ? cus.filter(r => r[f] === v) : [])); } }),
    get: () => Promise.resolve(qs(name === 'checkinUnions' ? [{ id: 'UA' }] : [])),
    doc: id => w.db.doc(name + '/' + id)
  });
  w.db.doc = p => ({ get: () => { const k = p.split('/'), d = k[0] === 'checkinConfig' ? { testers } : k[0] === 'cards' ? cards[k[1]] : null; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)) }); }, set: () => Promise.resolve() });
  w.currentUser.union = 'UA';
  const um = () => w.state.members.filter(m => w.isUserM(m) && !m.deleted);
  const by = uid => w.state.members.find(m => m.ckNo === uid);

  // オーナー以外・確認メンバーでない → 何もしない
  w.currentUser.uid = 'someone'; w._bxTesters = null;
  w.umCkSync(true); await sleep(60);
  c('確認メンバーでない人は取り込まない（読みにも行かない）', um().length === 1 && !reads.some(r => /checkinUsers/.test(r)));
  c('確認メンバーでない人には「受付から更新」が出ない', !w._bxOn());
  // 確認メンバー
  testers = ['someone']; w._bxTesters = null;
  w.umCkSync(true); await sleep(80);
  c('確認メンバーはユニオンで絞って受付のユーザーを読む', reads.indexOf('checkinUsers:union=UA') >= 0);
  const u1 = by('u1'), u2 = by('u2');
  c('新しいユーザーは紹介者（受付の番号）の下に足す', u1 && u1.parentId === 'r' && u1.title === 'ユーザー' && u1.lastName === '見本' && u1.firstName === 'はなこ' && u1.cardToken === 'tok1');
  c('同じ紹介者の下に同じ名前（空白の違いは無視）のユーザーがいれば、その人とつなぐ', u2 && u2.id === 'ux' && u2.ptCurrent === 120);
  c('紹介者がMAPで受付とつながっていない人・無効の人は足さない', !by('u3') && !by('u4') && um().length === 2);
  c('来場回数・最後の来場・PRYSMiO が入る', u1.uVisits === 3 && u1.uLastAt === cus[0].lastAt && u1.uPrysm === 820 && u2.uVisits === 1);
  c('会場でのお買い上げが購入の記録に入る（受講料の領収書は入らない）', (u1.buys || []).length === 1 && u1.buys[0].t === '見本の美容液×2 ほか1点' && u1.buys[0].d === '2026-10-14' && u1.buys[0].ck === 'rcpt_b_e1');
  c('手で入れた購入の記録は残る', u2.buys.length === 1 && u2.buys[0].t === '手で入れた記録');
  // もう一度（同じ内容）→ 二重にならない
  const n0 = w.state.members.length;
  w.umCkSync(true); await sleep(80);
  c('もう一度取り込んでも二重にならない', w.state.members.length === n0 && by('u1').buys.length === 1);
  // 受付で回数が増えた・お買い上げを取り下げた
  cus[0].visits = 4; cus[0].prysm = 1150; delete cards.tok1.rcpt_b_e1; cards.tok1.rcpt_b_e2 = { kind: 'buy', d: '2026-11-03', amt: 3000, items: [{ n: '見本のパック', q: 1, p: 3000 }] };
  w.umCkSync(true); await sleep(80);
  c('受付の変更（回数・数値）が入る', by('u1').uVisits === 4 && by('u1').uPrysm === 1150);
  c('受付で取り下げたお買い上げは消え、新しいものが入る', by('u1').buys.length === 1 && by('u1').buys[0].t === '見本のパック');
  // 台帳で消した人は足し直さない
  by('u2').deleted = true; const n1 = w.state.members.length;
  w.umCkSync(true); await sleep(80);
  c('台帳で消したユーザーは、次の取り込みで足し直さない', w.state.members.length === n1 && w.state.members.filter(m => m.ckNo === 'u2' && !m.deleted).length === 0);
  // 30分は自動で読み直さない
  const r0 = reads.length;
  w.umCkSync(false); await sleep(40);
  c('自動の取り込みは30分に1回', reads.length === r0);
  // 一覧の表示
  w._umMode = true; w._umRef = ''; w._umFlt = 'all';
  w.switchView('current'); await sleep(60);
  const tx = (document => (document.getElementById('treeCurrent') || {}).textContent || '')(w.document);
  c('一覧に来場回数・最後の来場・PRYSMiO の色', /来場 4回・10\/14プラチナメダリオン 1,150/.test(tx), tx.slice(0, 400));
  c('一覧に「受付から更新」（確認メンバー）', /受付から更新/.test(tx));
  // オーナー（指定しなくても）
  w.state.members = fresh(); testers = []; w._bxTesters = null; w.currentUser.uid = T.OWNER;
  try { w.localStorage.removeItem('gm_umCk_' + T.OWNER); } catch (e) {}
  w.umCkSync(false); await sleep(80);
  c('オーナーは指定しなくても取り込める', !!by('u1'));
  c('APP_JS_VERSION v864以降', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 864);
});
