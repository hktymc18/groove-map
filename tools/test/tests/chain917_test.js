// v917：共有の共有（結合経由）。読めない時は理由を出す・共有の画面を開くと配り直す・経由の共有を外す時に確認。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login();
  // ① 見る側：結合先が読めない時の案内
  w.sharedOwners = [{ uid: 'ogw', org: '見本小川', name: '見本小川' }, { uid: 'tkm', org: '見本嶽本', name: '見本嶽本', derived: true, viaName: '見本小川' }];
  w.viewingOwnerUid = 'ogw'; w.switchView('current'); await sleep(80);
  w._viewMerged = { owner: 'ogw', maps: [{ uid: 'tkm', name: '見本嶽本', graftId: 'x' }], data: {}, fail: { tkm: '見本嶽本' } };
  w._mgFailNote();
  const n = w.document.getElementById('mgFailNote');
  c('読めない結合先があると MAP の上に理由が出る', !!n && /見本嶽本 のツリーは、まだ見る許可が届いていません/.test(n.textContent) && /見本小川さんがアプリを開く/.test(n.textContent), n && n.textContent);
  w._viewMerged.fail = {}; w._mgFailNote();
  c('読めたら消える', !w.document.getElementById('mgFailNote'));
  w.viewingOwnerUid = null; w.stopViewMergedSync();
  // ② 共有の画面を開くと配り直す
  let called = 0; const orig = w.propagateDerivedShares; w.propagateDerivedShares = () => { called++; };
  w.openShareModal(); await sleep(20);
  c('共有の画面を開くと、結合したMAPの見る許可を配り直す', called === 1);
  w.propagateDerivedShares = orig; try { w.closeShareModal(); } catch (e) {}
  // ③ 経由の共有を外す時の確認
  let msg = ''; w.confirm = (m) => { msg = m; return false; };
  w.leaveSharedMap('tkm');
  c('経由の共有を外す時、経由した人の MAP の中も見えなくなると確認する', /見本小川さんの MAP の中の「見本嶽本」のメンバーも見えなくなります/.test(msg), msg);
  w.leaveSharedMap('ogw');
  c('ふつうの共有は今までの確認', /共有を外しますか/.test(msg) && !/MAP の中の/.test(msg));
});
