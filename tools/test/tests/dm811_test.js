// v811：テスト用アカウントのデモ用データ（?demo=build／?demo=restore）。2026.08を基点に2025.08〜2026.10を右肩上がりに
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const uid = w.currentUser.uid;
  // 架空のメンバー：自分＋BR2人＋その下など20人
  const base = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both', activity: 'S', actRate: 120, ptSelf: 800, startMonth: '2024.01' }];
  const FN = ['一郎', '二郎', '三郎', '四郎', '五郎', '六子', '七子', '八子', '九子', '十子'];
  for (let i = 0; i < 20; i++) {
    const par = i < 3 ? 'r' : 'm' + (i % 3);
    base.push({ id: 'm' + i, lastName: '試験', firstName: FN[i % 10] + i, title: i < 2 ? 'BR' : (i % 4 === 0 ? 'B3' : 'LOI'), parentId: par, mapType: 'both', activity: ['S', 'A', 'B', 'C'][i % 4], actRate: 90, ptSelf: 200 + i * 20, startMonth: '2025.01' });
  }
  base.push({ id: 'gone', lastName: '消した', firstName: '人', parentId: 'r', deleted: true, mapType: 'both' });
  const st = w.getDefaultStats();
  st.monthly.forEach(rw => { if (rw.label === 'コミッション') rw.vals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500000]; });
  const g = w._demoGenerate(base, [base[0]], { stats: st, commission: {}, freshData: { a: 1 } }, uid);
  const mons = Object.keys(g).sort();
  c('15か月分（2025.08〜2026.10）', mons.length === 15 && mons[0] === '2025.08' && mons[14] === '2026.10');
  const live = mon => g[mon].current.members.filter(m => !m.deleted);
  const B = g['2026.08'].current.members;
  const same = base.every(m0 => { const m = B.filter(x => x.id === m0.id)[0]; return m && m.ptSelf === m0.ptSelf && m.title === m0.title && m.activity === m0.activity && m.parentId === m0.parentId; });
  c('基点の月（2026.08）は元のメンバー・数字のまま（消した人も残す）', same && B.length === base.length);
  c('基点の月の理想MAPは元の理想MAP・数字の手入力も残る', g['2026.08'].ideal.members.length === 1 && g['2026.08'].stats.freshData.a === 1);
  const com = mon => Number(g[mon].stats.stats.monthly.filter(r => r.label === 'コミッション')[0].vals[11]);
  const n = mons.map(m => live(m).length);
  c('前の月ほど人数が少ない（2025.08は基点の半分以下）', n[0] < n[12] / 2 && n.slice(0, 13).every((v, i, a) => i === 0 || v >= a[i - 1]));
  c('9月・10月は新しい人が増える', n[13] > n[12] && n[14] > n[13] && live('2026.10').some(m => /^demo-202610/.test(m.id)));
  const gsv = mons.map(m => live(m).reduce((s, x) => s + (x.ptSelf || 0), 0));
  const dips = gsv.filter((v, i) => i > 0 && v < gsv[i - 1]).length;
  c('全体のPTは右肩上がり（最後は最初の2倍以上）', gsv[14] > gsv[0] * 2 && gsv[14] > gsv[12]);
  c('ところどころ下がる月もある', dips >= 2 && dips <= 6);
  const cs = mons.map(com);
  c('コミッションも上がり下がりしながら右肩上がり', cs.filter((v, i) => i > 0 && v < cs[i - 1]).length >= 2 && cs[14] > cs[0] * 3);
  const ok = mons.every((mon, k) => live(mon).every(m => m.startMonth <= mon && (!m.parentId || live(mon).some(p => p.id === m.parentId))));
  c('入った月（startMonth）はその月以前・親は必ずいる', ok);
  c('入ったばかり（3か月未満）の人はBRになっていない', mons.every((mon, k) => k === 12 || live(mon).every(m => !m.parentId || m.title !== 'BR' || k - mons.indexOf(m.startMonth) >= 3)));
  c('コミッション：基点の月は元の値・前の月は少なく・後の月は多い', com('2026.08') === 500000 && com('2025.08') < 400000 && com('2026.10') > 500000);
  c('コミッションの12列の最初の方（2025.08より前）は空', g['2025.10'].stats.stats.monthly.filter(r => r.label === 'コミッション')[0].vals[0] === '');
  c('GSV（ptCurrent）も計算されている', live('2026.10')[0].ptCurrent > 0);
  // 使えるアカウント
  w.currentUser.email = 'test10@gmail.com'; c('test10@ のアカウントは使える', w._demoOk());
  w.currentUser.email = 'someone@gmail.com'; c('ほかのアカウントでは使えない', !w._demoOk());
  // 書き換え・戻す（偽のdb）
  w.currentUser.email = 'test10@gmail.com';
  const DB = {}, P = s => 'maps/' + uid + '/' + s;
  DB[P('months/2026.08_current')] = { members: base, updatedAt: 'T' };
  DB[P('months/2026.08_ideal')] = { members: [base[0]], updatedAt: 'T' };
  DB[P('stats/2026.08')] = { stats: st, commission: {}, freshData: {}, updatedAt: 'T' };
  DB[P('months/2025.12_current')] = { members: [{ id: 'old', lastName: '昔の', firstName: '人', parentId: '' }], updatedAt: 'OLD' };
  const orig = JSON.parse(JSON.stringify(DB));
  w.db = Object.assign({}, w.db, { doc: p => ({
    get() { const d = DB[p]; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)), metadata: {} }); },
    set(d) { DB[p] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); },
    delete() { delete DB[p]; return Promise.resolve(); }
  }) });
  const cnt = await w.demoBuild();
  c('15か月分を書き込む', cnt === 15 && mons.every(m => DB[P('months/' + m + '_current')] && DB[P('stats/' + m)]));
  c('書き換える前の控えを残す（無かった月は「無かった」と残す）', DB[P('months/2025.12_current_bakdemo')].data.updatedAt === 'OLD' && DB[P('months/2026.10_current_bakdemo')].had === false);
  await w.demoBuild();
  c('もう一度作っても、最初の控えはそのまま', DB[P('months/2025.12_current_bakdemo')].data.updatedAt === 'OLD');
  const r = await w.demoRestore();
  c('戻すと書き換える前と同じ（控えも消える）', r === 45 && JSON.stringify(Object.keys(DB).sort()) === JSON.stringify(Object.keys(orig).sort()) && DB[P('months/2025.12_current')].updatedAt === 'OLD');
});
