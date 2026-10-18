// v815：ほかの地域のユニオンで活動している人（受付の名簿で「MAPで連携するユニオン」に自分のユニオン）も受付連携でつなぐ。
//   稼働率はその人のユニオンの「連携先向けの集計」（{ユニオン}__{key}__to__{自分のユニオン}）から、研修はその人の名簿の受講記録から
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '' }), M('a', '試験', '二郎', 'B3', { actRate: 10 }), M('x', '見本', '三郎', 'PG', { trainee: true, actRate: 5 })];
  const own = [{ no: 'A001', union: 'UA', name: '試験 二郎' }];
  const ext = [{ no: 'B001', union: 'UB', name: '見本 三郎', trainee: true, alsoUnions: ['UA'], trainings: { PG: { at: '2026-10-02' }, DLR: { at: '2026-10-09' } } },
    { no: 'B002', union: 'UB', name: '例題 四郎', referrer: '架空 一郎', alsoUnions: ['UA'] }];
  const stats = { 'UA__last1m': { union: 'UA', held: 8, rates: { A001: { rate: 75 } } }, 'UB__last1m__to__UA': { union: 'UB', view: 'UA', held: 6, rates: { B001: { rate: 83 }, B002: { rate: 50 } } },
    'UC__last1m__to__UA': { union: 'UX', view: 'UA', held: 6, rates: {} } };
  let denyShared = false, statReads = [];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.no, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({
    where: (f, op, v) => ({ get: () => name !== 'checkinMembers' ? Promise.resolve(qs([])) : f === 'union' ? Promise.resolve(qs(own.filter(r => r.union === v)))
      : (denyShared ? Promise.reject(new Error('permission-denied')) : Promise.resolve(qs(ext.filter(r => (r.alsoUnions || []).indexOf(v) >= 0)))) }),
    get: () => Promise.resolve({ forEach: f => [{ id: 'UA', data: () => ({}) }].forEach(f) }),
    doc: id => ({ get: () => { statReads.push(id); const d = stats[id]; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)) }); } })
  });
  w.currentUser.union = 'UA';
  const m = id => w.state.members.find(x => x.id === id);
  w._ckLink = { unions: [{ id: 'UA', area: '' }], sel: 'UA' }; w._ckPgI = 0;
  w.ckLinkLoad(); await sleep(40);
  const it = id => w._ckLink.items.find(x => x.m.id === id);
  c('ほかのユニオンの人も名前で自動一致', it('x').kind === 'auto' && it('x').r.no === 'B001' && it('x').r._ext && it('a').kind === 'auto');
  c('「他ユニオン」とユニオン名の印が出る', /他ユニオン：UB/.test($('#ckPg').textContent) && /ほかのユニオンで活動している 2人/.test($('#ckPg').textContent));
  w.ckLinkApply(); await sleep(60);
  c('つなぐと、どのユニオンの人かも覚える', m('x').checkinNo === 'B001' && m('x').checkinUnion === 'UB' && m('a').checkinNo === 'A001' && !m('a').checkinUnion);
  c('稼働率：自分のユニオンの人は自分の集計から', m('a').actRate === 75);
  c('稼働率：ほかのユニオンの人はその人のユニオンの連携先向けの集計から', m('x').actRate === 83 && statReads.indexOf('UB__last1m__to__UA') >= 0);
  // 名簿から追加
  w._ckLink.adds = null; w._ckPrep();
  const ad = w._ckLink.adds.find(a => a.r.no === 'B002');
  c('名簿から追加にも出る（紹介者がMAPにいる）', ad && ad.pid === 'r');
  w.ckAddApply(); await sleep(40);
  const y = w.state.members.find(x => x.checkinNo === 'B002');
  c('追加した人もどのユニオンの人か覚える', y && y.checkinUnion === 'UB');
  w.ckLinkClose();
  // 研修の自動取り込み（1日1回）
  w.state.isEditor = true; try { w.localStorage.removeItem('gm_ckTr_' + w.currentUser.uid); } catch (e) {}
  w._ckTrBusy = false; w.ckTrAuto(true); await sleep(80);
  c('研修：ほかのユニオンの名簿の受講記録（PG・DLR）も取り込む', ['PG', 'DLR'].every(s => m('x').traineeHistory.some(h => h.status === s && h.result === 'next')));
  // 別のユニオンの名前を名乗る偽の集計は使わない
  m('x').checkinUnion = 'UC'; m('x').actRate = 5;
  w._ckLink = { unions: [{ id: 'UA', area: '' }], sel: 'UA' }; w.ckImportRates(() => {}); await sleep(40);
  c('集計の union が合わない文書は使わない', m('x').actRate === 5);
  m('x').checkinUnion = 'UB';
  // ルールが未反映（連携の一覧が読めない）でも今までどおり動く
  denyShared = true; w._ckLink = { unions: [{ id: 'UA', area: '' }], sel: 'UA' };
  w.ckLinkLoad(); await sleep(40);
  c('連携の一覧が読めない時も自分のユニオンだけで動く', w._ckLink.items.find(x => x.m.id === 'a').kind === 'linked' && w._ckLink.nExt === 0);
  w.ckLinkClose();
});
