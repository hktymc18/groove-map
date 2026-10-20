// v829：ユニオンのチェック項目の設定。↑↓をやめて ⠿ をつかんで並べ替え・下の欄に書いたまま「保存する」でも足される・［追加］ボタン
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  let saved = null;
  const fg = w.fsGet;
  w.fsGet = p => Promise.resolve(p === 'unions/U1/cdata/mapChecklist' ? null : fg(p));
  w.db.doc = p => ({ set(d) { if (p === 'unions/U1/cdata/mapChecklist') saved = d; return Promise.resolve(); }, get() { return Promise.resolve({ exists: false, data: () => null }); }, onSnapshot() { return () => {}; } });
  w.currentUser.union = 'U1'; w.currentUser.role = 'admin'; w.currentUser.uid = 'someone';
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'BR', parentId: '', mapType: 'both' }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(20);
  w.p2Go('ck'); await sleep(30);
  w.p2CkAdm(); await sleep(10);
  const n = w.P2_CK_ESS.length;
  c('行は ⠿・名前・✕ だけ（↑↓はなし）', $$('#p2CkAdmLs .tdo-row').length === n && $$('#p2CkAdmLs .tdo-handle').length === n && !/[↑↓]/.test($('#p2CkAdmLs').textContent));
  c('足す欄の横に［追加］ボタン・並べ替えの説明', /追加/.test($('#p2CkAdmOv .ad').textContent) && /⠿ を押したまま/.test($('#p2CkAdmOv').textContent));
  // ［追加］ボタン
  $('#p2CkAdmIn').value = 'ウェルカムコール'; $('#p2CkAdmOv .ad .adb').click(); await sleep(40);
  c('［追加］で足せる', $$('#p2CkAdmLs input').length === n + 1 && $$('#p2CkAdmLs input')[n].value === 'ウェルカムコール' && $('#p2CkAdmIn').value === '');
  // 名前を直した行（onchange 前）と、書きかけの項目をそのまま保存
  $$('#p2CkAdmLs input')[0].value = '手帳（直した）';
  $('#p2CkAdmIn').value = '体験会に誘う';
  // 書きかけのまま TRAINING に切りかえても、必須アイテムのほうに残る
  w.p2CkAdmTab('tr'); await sleep(5);
  w.p2CkAdmTab('ess'); await sleep(5);
  c('書きかけは切りかえる前のタブに足される', $$('#p2CkAdmLs input').length === n + 2 && $$('#p2CkAdmLs input')[n + 1].value === '体験会に誘う' && $$('#p2CkAdmLs input')[0].value === '手帳（直した）');
  $('#p2CkAdmIn').value = '名刺100枚';
  w.p2CkAdmSave(); for (let i = 0; i < 40 && !saved; i++) await sleep(20);
  c('改行を押さずに「保存する」でも足される', saved && saved.ess.length === n + 3 && saved.ess[n + 2].t === '名刺100枚' && saved.ess[n].t === 'ウェルカムコール');
  c('名前の直しも保存される', saved && saved.ess[0].t === '手帳（直した）' && saved.ess[0].id === 'ess_0');
  c('TRAINING はそのまま', saved && saved.tr.length === w.P2_CK_TR.length);
  // ⠿ で並べ替え（3番目を先頭へ）
  await sleep(50); saved = null; w.p2CkAdm(); await sleep(10);
  const rows = $$('#p2CkAdmLs .tdo-row'), t2 = rows[2].querySelector('input').value;
  rows[2].querySelector('.tdo-handle').dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true }));
  c('つかむと動かしている印', rows[2].classList.contains('tpl-dragging'));
  rows[2].parentNode.insertBefore(rows[2], rows[0]);
  w.document.dispatchEvent(new w.MouseEvent('mouseup', { bubbles: true })); await sleep(5);
  c('離した場所の順番になる', $$('#p2CkAdmLs input')[0].value === t2 && !$('#p2CkAdmLs .tpl-dragging'));
  w.p2CkAdmSave(); for (let i = 0; i < 40 && !saved; i++) await sleep(20);
  c('並べ替えた順で保存', saved && saved.ess[0].t === t2);
});
