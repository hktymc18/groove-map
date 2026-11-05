// v865：受付でユーザーを研修生にしたら（checkinUsers.toMember）、NAVIGATORのユーザー台帳の人もMAPの研修生にする（紹介者の下・受付の研修生の番号でつなぐ）。
//   受付で「ユーザーに戻す」と、ユーザー台帳に戻る（MAPで昇格させた人は戻さない）。架空データ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '', checkinNo: 'A001' }), M('ux', '見本', 'はなこ', 'ユーザー', { ckNo: 'u1', ptCurrent: 90 })];
  const cus = [{ uid: 'u1', name: '見本 はなこ', union: 'UA', referrerNo: 'A001', cardToken: 'tok1', visits: 5, lastAt: 1, active: true, toMember: 'A0099' }];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.uid || r.id, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({ where: (f, op, v) => ({ get: () => Promise.resolve(qs(name === 'checkinUsers' ? cus.filter(r => r[f] === v) : [])) }), get: () => Promise.resolve(qs(name === 'checkinUnions' ? [{ id: 'UA' }] : [])) });
  w.db.doc = p => ({ get: () => Promise.resolve({ exists: /^cards/.test(p), data: () => ({ kind: 'user' }) }), set: () => Promise.resolve() });
  w.currentUser.union = 'UA'; w._bxTesters = null;
  const m = () => w.state.members.find(x => x.id === 'ux');
  w.umCkSync(true); await sleep(80);
  c('受付で研修生になった人は、MAPでも研修生（紹介者の下・受付の研修生の番号でつなぐ）', !w.isUserM(m()) && m().trainee === true && m().checkinNo === 'A0099' && m().parentId === 'r' && m().fromUser);
  c('ユーザーの記録（ポイント・受付の番号）はそのまま', m().ptCurrent === 90 && m().ckNo === 'u1' && m().uVisits === 5);
  const n0 = w.state.members.length;
  w.umCkSync(true); await sleep(80);
  c('もう一度取り込んでも、ユーザーとして足し直さない', w.state.members.length === n0 && w.state.members.filter(x => x.ckNo === 'u1').length === 1);
  delete cus[0].toMember;
  w.umCkSync(true); await sleep(80);
  c('受付で「ユーザーに戻す」と、ユーザー台帳に戻る', w.isUserM(m()) && !m().trainee && !m().checkinNo && m().toUser);
  cus[0].toMember = 'A0099'; w.umCkSync(true); await sleep(80);
  m().title = 'B1'; m().trainee = false; delete cus[0].toMember;
  w.umCkSync(true); await sleep(80);
  c('MAPで昇格させた人（研修生でなくなった人）は、ユーザーに戻さない', m().title === 'B1' && m().checkinNo === 'A0099');
});
