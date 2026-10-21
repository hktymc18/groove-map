// v831：兼務のユニオン管理者（checkinUnions/{un}.coreAdmins・受付と共通の設定）
//   アカウント管理は所属＋兼務のユニオン・オーナーが兼務を設定・管理者は所属ユニオンを変えられない・登録待ちの名簿はユニオンごと
//   チェック項目・ユニオン予定も兼務のユニオンで使える
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const ALL = [
    { id: 'a1', name: '架空 一', union: 'GRANT', status: 'active' }, { id: 'a2', name: '架空 二', union: 'GRANT', status: 'pending' },
    { id: 'l1', name: '見本 三', union: 'LIEN', status: 'pending' }, { id: 'z1', name: '他所 四', union: 'ZEN', status: 'active' },
    { id: 'adm', name: '兼務 管理', union: 'GRANT', role: 'admin', status: 'active' }
  ];
  const CU = { GRANT: { coreAdmins: [] }, LIEN: { coreAdmins: ['adm'] }, ZEN: { coreAdmins: [] } };
  const qs = [], sets = [], docs = {};
  const mkQ = (path, F) => ({
    where(f, op, v) { return mkQ(path, F.concat([[f, op, v]])); },
    get() {
      qs.push([path, F]);
      let L = [];
      if (path === 'users') L = ALL.filter(u => F.every(([f, op, v]) => op === 'in' ? v.indexOf(u[f]) >= 0 : u[f] === v));
      else if (path === 'checkinUnions') L = Object.keys(CU).filter(k => F.every(([f, op, v]) => op === 'array-contains' ? (CU[k][f] || []).indexOf(v) >= 0 : true)).map(k => Object.assign({ id: k }, CU[k]));
      else if (/^unions\/LIEN\/events$/.test(path)) L = [{ id: 'ue_l', union: 'LIEN', title: 'LIENの会', date: '2026-11-01' }];
      return Promise.resolve({ empty: !L.length, forEach(fn) { L.forEach(u => fn({ id: u.id, data: () => Object.assign({}, u) })); } });
    }
  });
  w.db = Object.assign({}, w.db, {
    collection(path) { return mkQ(path, []); },
    doc(p) { return { set(d) { sets.push([p, d]); docs[p] = d; return Promise.resolve(); }, get() { return Promise.resolve({ exists: !!docs[p], data: () => docs[p] }); }, delete() { return Promise.resolve(); }, onSnapshot() { return () => {}; } }; }
  });
  const fg = w.fsGetCol;
  w.fsGetCol = p => p === 'users' ? Promise.resolve(ALL.map(u => Object.assign({}, u))) : p === 'checkinUnions' ? Promise.resolve(Object.keys(CU).map(k => Object.assign({ id: k }, CU[k]))) : p === 'accNames' ? Promise.resolve([]) : fg(p);
  w.fsGet = p => Promise.resolve(docs[p] || null);
  w._admCkLoad = () => {};
  // ① 兼務がわかる
  w.currentUser = { uid: 'adm', name: '兼務 管理', union: 'GRANT', role: 'admin', unionSelectedV2: true, area: '福岡' };
  w._admCore = null; w._admCoreLoad(); await sleep(20);
  c('兼務のユニオンを読み込む（受付と同じ coreAdmins）', JSON.stringify(w._admUnions()) === '["GRANT","LIEN"]' && qs.some(q => q[0] === 'checkinUnions' && q[1].some(f => f[1] === 'array-contains' && f[2] === 'adm')));
  // ② アカウント管理：所属＋兼務の人だけ・ユニオンで絞れる
  qs.length = 0; w.openAdminPanel(); await sleep(40);
  c('所属と兼務のユニオンの人だけ読み込む', qs.some(q => q[0] === 'users' && q[1].some(f => f[1] === 'in' && f[2].join() === 'GRANT,LIEN')) && w._adminUsers.every(u => u.union !== 'ZEN'));
  c('上に「すべて／ユニオンごと」の切りかえ', !!$('#admUnF') && /すべて/.test($('#admUnF').textContent) && /LIEN 1人/.test($('#admUnF').textContent));
  c('すべての時は両方のユニオンの人', w._adminScopedUsers().length === 4);
  w.admUnF('LIEN'); await sleep(5);
  c('ユニオンで絞れる', w._adminScopedUsers().length === 1 && w._adminScopedUsers()[0].id === 'l1');
  w.admUnF('');
  c('兼務の管理者には兼務の設定は出さない（オーナーだけ）', !/兼務するユニオン/.test($('#adminBody').textContent));
  // 承認待ちの件数
  qs.length = 0; w._pendChkAt = 0; let tm = ''; const ot = w.toast; w.toast = m => { tm = m; };
  w.checkPendingApprovals(); await sleep(2400);
  c('承認待ちの件数も所属＋兼務のユニオン', /承認待ち 2件/.test(tm) && qs.some(q => q[0] === 'users' && q[1].some(f => f[1] === 'in') && q[1].some(f => f[0] === 'status')), tm);
  w.toast = ot; w.closeAdminPanel();
  // ③ 管理者は所属ユニオンを変えられない
  w.openProfileModal(); await sleep(10);
  c('管理者は所属ユニオンを変えられない（説明つき）', $('#profileUnion').disabled && /オーナーに伝えて/.test($('#profileUnionLock').textContent));
  w.closeProfileModal(null);
  // ④ 兼務だけの人（管理者の印なし）
  w.currentUser = { uid: 'adm', name: '兼務 管理', union: 'ZEN', role: 'member', unionSelectedV2: true };
  c('兼務だけの人：アカウント管理を開ける・所属ユニオンの管理者ではない', w._canAdmPanel() && !w.isCurrentAdmin() && JSON.stringify(w._admUnions()) === '["LIEN"]');
  qs.length = 0; w.openAdminPanel(); await sleep(40);
  c('兼務だけの人：兼務のユニオンの人だけ', w._adminScopedUsers().length === 1 && w._adminScopedUsers()[0].union === 'LIEN');
  w.openProfileModal(); await sleep(10);
  c('管理者の印がない人は所属ユニオンを変えられる', !$('#profileUnion').disabled);
  w.closeProfileModal(null);
  // ⑤ 登録待ちの名簿はユニオンごと
  w.currentUser = { uid: 'adm', name: '兼務 管理', union: 'GRANT', role: 'admin', unionSelectedV2: true };
  w.openAdminPanel(); await sleep(40); w.admUnF('LIEN');
  w.accPasteOpen(); $('#accIn').value = 'まだ 来ない人'; w.accMatch(); w.accApply(); await sleep(20);
  c('見つからない人は、絞り込んだユニオンの名簿へ', sets.some(s => s[0] === 'accNames/LIEN' && s[1].names.indexOf('まだ 来ない人') >= 0) && !sets.some(s => s[0] === 'appAccess/names'));
  w.admUnF(''); w.closeAdminPanel();
  // ⑥ オーナー：兼務を設定
  w.currentUser = { uid: T.OWNER, name: 'オーナー', union: 'GRANT' };
  sets.length = 0; w.openAdminPanel(); await sleep(40);
  c('オーナーには各行に「兼務」', /兼務：LIEN/.test($('#adminBody').textContent) && /＋ 兼務するユニオン/.test($('#adminBody').textContent));
  w.admCoreOpen('a1'); await sleep(5);
  c('兼務の窓：受付に登録されているユニオン・所属の印', $$('#admCoreL input').length === 3 && /受付システム/.test($('#accOv').textContent) && /所属/.test($('#admCoreL').textContent));
  $$('#admCoreL input').find(x => x.value === 'ZEN').checked = true; w.admCoreSave('a1'); await sleep(20);
  c('保存すると checkinUnions/{ユニオン}.coreAdmins に入る（変えたユニオンだけ）', sets.length === 1 && sets[0][0] === 'checkinUnions/ZEN' && sets[0][1].coreAdmins.join() === 'a1');
  w.admCoreOpen('adm'); $$('#admCoreL input').find(x => x.value === 'LIEN').checked = false; sets.length = 0; w.admCoreSave('adm'); await sleep(20);
  c('外せる', sets.length === 1 && sets[0][0] === 'checkinUnions/LIEN' && sets[0][1].coreAdmins.length === 0);
  CU.LIEN.coreAdmins = ['adm']; w.closeAdminPanel();
  // ⑦ チェック項目：兼務のユニオンも
  w.currentUser = { uid: 'adm', name: '兼務 管理', union: 'GRANT', role: 'admin', unionSelectedV2: true };
  w._admCore = ['LIEN'];
  docs['unions/LIEN/cdata/mapChecklist'] = { ess: [{ id: 'x1', t: 'LIENの項目' }], tr: [] };
  w.p2CkAdm(); await sleep(10);
  c('チェック項目：ユニオンの切りかえ', $$('#p2CkAdmOv .ckun span').length === 2 && /「GRANT」/.test($('#p2CkAdmOv .hd').textContent));
  w.p2CkAdmUn('LIEN'); await sleep(20);
  c('兼務のユニオンの設定を読む', /「LIEN」/.test($('#p2CkAdmOv .hd').textContent) && $$('#p2CkAdmLs input')[0].value === 'LIENの項目');
  sets.length = 0; w.p2CkAdmSave(); await sleep(20);
  c('兼務のユニオンに保存', sets.some(s => s[0] === 'unions/LIEN/cdata/mapChecklist' && s[1].ess[0].t === 'LIENの項目'));
  // ⑧ ユニオン予定：兼務のユニオンへ配信・兼務のユニオンの予定も読む
  c('予定を配信できるユニオン：所属＋兼務', JSON.stringify(w._efUnionList()) === '["GRANT","LIEN"]');
  qs.length = 0; w.loadUnionEvents(); await sleep(30);
  c('兼務のユニオンの予定も読む（直す・消すため）', qs.some(q => q[0] === 'unions/LIEN/events') && w._unionRaw.some(u => u.id === 'ue_l' && u.union === 'LIEN'));
  w.openEventModal(null, '2026-11-02', '', 'event'); await sleep(20);
  w.evUnionScope(true, 'LIEN');
  $('#evTitle').value = '兼務の会'; $('#evDate').value = '2026-11-02';
  sets.length = 0; w.confirm = () => true; w._unionSaveFromModal(''); await sleep(20);
  const ue = sets.find(s => /^unions\/LIEN\/events\//.test(s[0]));
  c('選んだ兼務のユニオンに配信', ue && ue[1].union === 'LIEN' && ue[1].title === '兼務の会');
  // 兼務していないユニオンには配信できない
  w.openEventModal(null, '2026-11-02', '', 'event'); await sleep(20); w.evUnionScope(true, 'ZEN');
  $('#evTitle').value = 'x'; $('#evDate').value = '2026-11-02'; sets.length = 0; w._unionSaveFromModal(''); await sleep(10);
  c('兼務していないユニオンには配信しない', !sets.some(s => /^unions\/ZEN/.test(s[0])));
});
