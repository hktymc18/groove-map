// v738：チェックの項目をユニオンごとに管理者が設定（unions/{un}/cdata/mapChecklist）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  let saved = null, store = null;
  const fg = w.fsGet;
  w.fsGet = p => Promise.resolve(p === 'unions/U1/cdata/mapChecklist' ? store : fg(p));
  w.db.doc = p => ({ set(d) { saved = { p, d }; return Promise.resolve(); }, get() { return Promise.resolve({ exists: false, data: () => null }); }, onSnapshot() { return () => {}; } });
  w.currentUser.union = 'U1'; w.currentUser.role = 'member'; w.currentUser.uid = 'someone';
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'BR', parentId: '', mapType: 'both' }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(20);
  w._p2().check = { ess_0: true, ess_d_0: '2026-10-01' };
  w.p2Go('ck'); await sleep(30);
  const tx = () => ($('#view-plan')).textContent;
  c('設定がない時は標準の項目（前のチェックはそのまま）', $$('.p2ck-r').length === w.P2_CK_ESS.length && $$('.p2ck-r')[0].classList.contains('done') && $$('.p2ck-r .dt')[0].value === '2026-10-01');
  c('一般メンバーには設定のリンクが出ない', tx().indexOf('ユニオンのチェック項目を設定') < 0);
  // 管理者
  w.currentUser.role = 'admin'; w.renderPlan(); await sleep(10);
  c('ユニオン管理者には ⚙ 設定のリンク', tx().indexOf('ユニオンのチェック項目を設定') >= 0);
  w.p2CkAdm(); await sleep(10);
  c('設定の画面が開く（標準の項目が並ぶ）', !!$('#p2CkAdmOv') && $$('#p2CkAdmOv .ls .r').length === w.P2_CK_ESS.length);
  $('#p2CkAdmIn').value = '名刺100枚'; w.p2CkAdmAdd(); await sleep(40);
  c('項目を足せる', $$('#p2CkAdmOv .ls .r').length === w.P2_CK_ESS.length + 1);
  const n = w.P2_CK_ESS.length;
  w.p2CkAdmMv(n, -1); await sleep(5);
  c('並べかえ（↑）', $$('#p2CkAdmOv .ls .r input')[n - 1].value === '名刺100枚');
  w.confirm = () => true; w.p2CkAdmDel(1); await sleep(5);
  c('外せる', $$('#p2CkAdmOv .ls .r').length === n);
  w.p2CkAdmT(0, '  手帳（新しい）  ');
  w.p2CkAdmTab('tr'); await sleep(5);
  c('TRAINING のタブにも切りかえ', $$('#p2CkAdmOv .ls .r').length === w.P2_CK_TR.length);
  w.p2CkAdmSave(); await sleep(20);
  c('unions/U1/cdata/mapChecklist に保存', saved && saved.p === 'unions/U1/cdata/mapChecklist' && saved.d.ess.length === n && saved.d.tr.length === w.P2_CK_TR.length);
  c('前からある項目は同じid（チェックが残る）・名前の変更も入る', saved.d.ess[0].id === 'ess_0' && saved.d.ess[0].t === '手帳（新しい）');
  c('保存したら閉じて、チェックの画面が新しい項目に', !$('#p2CkAdmOv') && $$('.p2ck-r').length === n && $$('.p2ck-r .t')[0].textContent === '手帳（新しい）' && $$('.p2ck-r')[0].classList.contains('done'));
  const nw = saved.d.ess.filter(x => x.t === '名刺100枚')[0];
  c('新しい項目は独自のid', nw && /^c/.test(nw.id));
  // 新しい項目をチェック・日付
  const ix = saved.d.ess.indexOf(nw);
  w.p2CkTgl('ess', ix); await sleep(10);
  c('新しい項目もチェックできる', w._p2().check[nw.id] === true && !!w._p2().check[nw.id + '_d']);
  // 別の人：読み込みで反映
  store = { ess: [{ id: 'cX', t: 'ユニオンの項目だけ' }], tr: [] };
  w.currentUser.role = 'member'; w._p2CkLoad(true); await sleep(20);
  c('ほかのメンバーは読み込んだユニオンの項目が出る', $$('.p2ck-r').length === 1 && $$('.p2ck-r .t')[0].textContent === 'ユニオンの項目だけ' && tx().indexOf('「U1」の設定') >= 0);
  const cnt = w._p2CkCount();
  c('数（ホームのタイル）も新しい項目で数える', cnt.total === 1);
  w.fsGet = fg;
});
