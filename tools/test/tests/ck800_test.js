// v800：MAPでOUTにした人は受付連携で取り込まない（つなぐ・稼働率・研修・OL）。名簿から追加でも、もう一度は出さない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '山内', '北斗', 'ゴールド', { parentId: '' }),
    M('a', '佐藤', '花', 'B3', { checkinNo: '101', actRate: 10 }),
    M('o', '村瀬', '匡哉', 'OUT'),                                   // 名前が一致するがOUT → つながない
    M('p', '上田', '裕', 'OUT', { checkinNo: '103', actRate: 20 }),  // つながっていたがOUT → 稼働率を取り込まない
    M('q', '石井', '海', 'OUT', { trainee: true })];                  // OUTの研修生 → 研修を取り込まない
  const roster = [{ no: '101', name: '佐藤 花' }, { no: '102', name: '村瀬 匡哉', referrer: '山内 北斗' }, { no: '103', name: '上田 裕' },
    { no: '104', name: '石井 海', trainee: true, trainings: { PG: { at: '2026-10-01' } } }];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.no, data: () => Object.assign({}, r) })) });
  w.db.collection = name => ({
    where: () => ({ get: () => Promise.resolve(qs(roster)) }),
    get: () => Promise.resolve(qs([])),
    doc: () => ({ get: () => Promise.resolve({ exists: true, data: () => ({ held: 8, rates: { '101': { rate: 75 }, '102': { rate: 50 }, '103': { rate: 90 } } }) }) })
  });
  w._ckLink = { unions: [{ id: 'U1', area: '' }], sel: 'U1' }; w._ckPgI = 0;
  w.ckLinkLoad(); await sleep(40);
  const it = id => w._ckLink.items.find(x => x.m.id === id);
  c('OUTの人は一覧に出ない（自動で一致にもならない）', !it('o') && !it('p') && !it('q') && it('a').kind === 'linked');
  c('「OUTにした 3人は取り込みません」と出す', /OUTにした 3人は取り込みません/.test($('#ckPg').textContent));
  w.ckLinkApply(); await sleep(40);
  const m = id => w.state.members.find(x => x.id === id);
  c('取り込んでもOUTの人はつながない・稼働率はそのまま', !m('o').checkinNo && m('p').actRate === 20 && m('a').actRate === 75);
  // 名簿から追加：OUTの人（同じ名前）は、もう一度は出さない
  w._ckLink.adds = null; w._ckPrep();
  c('名簿から追加にOUTの人は出ない', !w._ckLink.adds.some(a => a.r.no === '102' || a.r.no === '103' || a.r.no === '104'));
  // 研修の自動取り込み
  const o = w._ckTrSyncAll(roster);
  c('OUTの研修生には研修を取り込まない・つながない', !m('q').checkinNo && m('q').traineeHistory.length === 0 && o.n === 0);
  w.ckLinkClose();
});
