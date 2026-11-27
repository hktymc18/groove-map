// v927：MAP の結合は許可制（オーナー・管理者・アカウント管理で許可した人だけ）。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-27T03:00:00Z' });
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const me = w.currentUser.uid;
  const realOwner = w.isOwnerUid; w.isOwnerUid = id => false; // テストのログインはオーナーなので、ふつうのメンバーにする
  w.currentUser.role = 'member'; w.currentUser.canMerge = false; w.currentUser.union = 'REVE';
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '太郎', title: 'B3', parentId: '', mapType: 'both' }];
  // 結合のボタン
  let toasted = ''; const realToast = w.toast; w.toast = m => { toasted = m; };
  w.openMergePicker({ uid: 'kid', name: '見本 下' }); await sleep(20);
  c('許可が無いと結合の画面を開けず、許可が要ると知らせる', !$('#mergePickOv') && /許可された人だけ/.test(toasted), toasted);
  // 前からしていた結合を外す（表示を止めて、自分が配った連鎖共有を片付ける）
  const realGet = w.fsGet, realCol = w.fsGetCol, realDoc = w.db.doc.bind(w.db); const deleted = [];
  w.fsGet = p => p === 'maps/' + me + '/meta/merged' ? Promise.resolve({ maps: [{ uid: 'kid', name: '見本 下', graftId: 'r' }] }) : realGet(p);
  w.fsGetCol = p => p === 'maps/' + me + '/shared' ? Promise.resolve([{ id: 'sub', recipientUid: 'sub' }]) : realCol(p);
  w.db.doc = p => { const d = realDoc(p); d.delete = () => { deleted.push(p); return Promise.resolve(); }; return d; };
  try { w.localStorage.removeItem('gm_mgOff_' + me); } catch (e) {}
  w.loadMergedConfig(); await sleep(60);
  c('許可が無いと、今の結合は外れる（ツリーに出さない）', (w.state.mergedMaps || []).length === 0 && !w.isMerged('kid'));
  c('自分が配った連鎖共有を片付ける', deleted.includes('maps/kid/shared/sub'), deleted.join());
  c('片付けは1回だけ（覚えておく）', w.localStorage.getItem('gm_mgOff_' + me) === '1');
  deleted.length = 0; w.loadMergedConfig(); await sleep(60);
  c('2回目からは片付けの読み取りをしない', deleted.length === 0);
  // 許可を付けてもらうと元に戻る
  w.currentUser.canMerge = true; let prop = 0; const realProp = w.propagateDerivedShares; w.propagateDerivedShares = () => { prop++; };
  w.loadMergedConfig(); await sleep(700);
  c('許可が付くと、前の結合が元に戻り、連鎖共有を配り直す', w.isMerged('kid') && prop >= 1 && w.localStorage.getItem('gm_mgOff_' + me) === null);
  w.openMergePicker({ uid: 'kid2', name: '見本 下2' }); await sleep(20);
  c('許可があれば結合の画面を開ける', !!$('#mergePickOv'));
  w.closeMergePicker();
  w.currentUser.canMerge = false; w.currentUser.role = 'admin';
  c('管理者は許可が無くても結合できる', w._canMerge());
  w.currentUser.role = 'member';
  // 共有 MAP を見る側：持ち主に許可が無ければ、結合したツリーを出さない
  w.fsGet = p => p === 'maps/up1/meta/merged' ? Promise.resolve({ maps: [{ uid: 'kid', name: 'x', graftId: 'r' }] })
    : (p === 'users/up1' ? Promise.resolve({ role: 'member' }) : (p === 'users/up2' ? Promise.resolve({ canMerge: true }) : (p === 'maps/up2/meta/merged' ? Promise.resolve({ maps: [{ uid: 'kid', name: 'x', graftId: 'r' }] }) : Promise.resolve(null))));
  w.viewingOwnerUid = 'up1'; w.startViewMergedSync('up1'); await sleep(60);
  c('見る側：持ち主に許可が無ければ、結合したツリーは出ない', w._viewMerged.maps.length === 0);
  w.viewingOwnerUid = 'up2'; w.startViewMergedSync('up2'); await sleep(60);
  c('見る側：持ち主に許可があれば、今まで通り出る', w._viewMerged.maps.length === 1);
  w.viewingOwnerUid = null; w.stopViewMergedSync();
  // アカウント管理の札
  w.currentUser.role = 'admin'; w._admOf = un => un === 'REVE';
  w._adminUsers = [{ id: 'm1', name: '見本 はなこ', union: 'REVE', status: 'active' }, { id: 'm2', name: '見本 管理', union: 'REVE', status: 'active', role: 'admin' }];
  const chip = id => w._admMgChip(w._adminUsers.find(u => u.id === id));
  c('メンバーに「＋ MAPの結合」が出る・管理者には出ない', /＋ MAPの結合/.test(chip('m1')) && chip('m2') === '');
  let wrote = null; w.confirm = () => true; const realSet = w.fsSet; w.fsSet = (p, d) => { wrote = { p, d }; return Promise.resolve(); };
  w.admMgToggle('m1'); await sleep(30);
  c('押すと users に canMerge: true を書き、札が「結合できる」になる', wrote && wrote.p === 'users/m1' && wrote.d.canMerge === true && /MAPを結合できる/.test(chip('m1')));
  w.fsSet = realSet; w.fsGet = realGet; w.fsGetCol = realCol; w.propagateDerivedShares = realProp; w.isOwnerUid = realOwner; w.toast = realToast;
});
