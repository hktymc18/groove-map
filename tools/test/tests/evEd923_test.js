// v923：ユニオン予定の「予定係」（管理者にしなくても、所属ユニオンのユニオン予定だけ入れられる）。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-26T03:00:00Z' });
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const me = w.currentUser.uid;
  w.currentUser.union = 'REVE'; w.currentUser.role = 'member'; w.currentUser.area = '福岡';
  const realAdm = w._admOf, realIca = w.isCurrentAdmin;
  w.isCurrentAdmin = () => false; w._admOf = () => false; // ふつうのメンバーで試す（テストのログインはオーナー扱いのため）
  w._evEdMine = '';
  c('ふつうのメンバーはユニオン予定を作れない', !w._canUnionEv('REVE') && w._efUnionList().length === 0);
  // 予定係になったことを読む
  const realDoc = w.db.doc.bind(w.db); let asked = '';
  w.db.doc = p => { const d = realDoc(p); if (/meta\/evEditors$/.test(p)) { asked = p; d.get = () => Promise.resolve({ exists: true, data: () => ({ uids: ['x', me] }) }); } return d; };
  w._evEdLoad(); await sleep(30);
  c('ログインの時に、所属ユニオンの予定係の一覧を1回読む', asked === 'unions/REVE/meta/evEditors');
  c('予定係なら所属ユニオンの予定を作れる・ほかのユニオンは作れない', w._canUnionEv('REVE') && !w._canUnionEv('OTHER') && JSON.stringify(w._efUnionList()) === '["REVE"]');
  c('覚えておく（次に開いた時もすぐ使える）', w.localStorage.getItem('gm_evEd_' + me) === 'REVE');
  // ユニオン予定の一覧に「＋ 追加」
  w._unionPrefs = { off: false, hidden: [] };
  const ev = (id, area) => ({ id, title: 'セミナー' + id, date: '2026-12-01', area, union: 'REVE', createdBy: 'someone' });
  w._unionRaw = [ev('a', '福岡'), ev('b', '大阪')];
  w.openUnionListSheet(); await sleep(30);
  c('ユニオン予定の一覧に「＋ ユニオン予定を追加」が出る', /ユニオン予定を追加/.test($('#unSheetOv').textContent));
  w.closeUnionSheet();
  w._unionApplyToState();
  c('予定係はほかの地域の予定も見える（直すため）', w.state.events.filter(e => e._union).length === 2);
  w.openUnionEventSheet('UN_a'); await sleep(30);
  c('予定を開くと 直す・消す ができる', !!w.document.querySelector('#unSheetOv [onclick^="unionDelete"]'));
  w.closeUnionSheet && w.closeUnionSheet();
  // 外された時
  w.db.doc = p => { const d = realDoc(p); if (/meta\/evEditors$/.test(p)) d.get = () => Promise.resolve({ exists: true, data: () => ({ uids: ['x'] }) }); return d; };
  w._evEdLoad(); await sleep(30);
  c('一覧から外されたら作れなくなる', !w._canUnionEv('REVE') && w.localStorage.getItem('gm_evEd_' + me) === '');
  await sleep(80); w._unionRaw = [ev('a', '福岡'), ev('b', '大阪')]; // 変わった時に読み直すので（テストでは空になる）入れ直す
  w.openUnionEventSheet('UN_a'); await sleep(30);
  c('外されたら 消すボタンは出ず、予定係の案内が出る', !w.document.querySelector('#unSheetOv [onclick^="unionDelete"]') && /予定係/.test($('#unSheetOv').textContent));
  w.closeUnionSheet && w.closeUnionSheet();
  // アカウント管理の札（管理者として）
  w._admOf = un => un === 'REVE'; w.isCurrentAdmin = () => true;
  w._adminUsers = [{ id: 'm1', name: '見本 はなこ', union: 'REVE', status: 'active' }, { id: 'm2', name: '見本 管理', union: 'REVE', status: 'active', role: 'admin' }, { id: 'm3', name: '見本 よそ', union: 'OTHER', status: 'active' }];
  w._admEvAll = { REVE: [] };
  const chip = id => w._admEvChip(w._adminUsers.find(u => u.id === id));
  c('同じユニオンのメンバーに「＋ ユニオン予定の入力」が出る・管理者と よそのユニオンの人には出ない', /ユニオン予定の入力/.test(chip('m1')) && chip('m2') === '' && chip('m3') === '');
  let wrote = null; w.confirm = () => true;
  const FV = w.firebase.firestore.FieldValue; if (!FV.arrayRemove) FV.arrayRemove = (...a) => ({ rm: a }); // テストの土台に無いので
  w.db.doc = p => { const d = realDoc(p); d.set = (data, o) => { wrote = { p, data, o }; return Promise.resolve(); }; return d; };
  w.admEvToggle('m1'); await sleep(30);
  c('押すと予定係にする（一覧に足す・merge）', wrote && wrote.p === 'unions/REVE/meta/evEditors' && wrote.o && wrote.o.merge && /📅 ユニオン予定を入力できる/.test(chip('m1')));
  w.admEvToggle('m1'); await sleep(30);
  c('もう一度押すと外す', /＋ ユニオン予定の入力/.test(chip('m1')));
  w._admOf = realAdm; w.isCurrentAdmin = realIca;
});
