// v926（#42）：前の月に作った翌月の予定の「関連メンバー」が、月が変わると「?」になる（翌月へコピーしていない＝その月の MAP がまだ無い時）
//   自分のメンバー・共有（結合）メンバーのどちらも、名前で出て、保存しても外れないこと。年またぎ（12月→1月）も。データは架空。
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
const OU = 'abcdef999'; // 共有（結合）してくれている人
// 架空の Firestore：パス → データ。onSnapshot も同じ中身を返す
const store = {};
const reads = [];
T.dbStub.doc = function (p) {
  return {
    set(d) { store[p] = d; return Promise.resolve(); },
    get() { reads.push(p); const d = store[p]; return Promise.resolve({ exists: !!d, data: () => d || null, metadata: { fromCache: false } }); },
    delete() { delete store[p]; return Promise.resolve(); }, update() { return Promise.resolve(); },
    onSnapshot(cb) { const d = store[p]; setTimeout(() => cb({ exists: !!d, data: () => d || null }), 0); return () => {}; },
    collection(cc) { return T.dbStub.collection(p + '/' + cc); },
    get ref() { return this; },
  };
};
const ownMembers = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'BR', parentId: '', mapType: 'both' }, { id: 'k1', lastName: '見本', firstName: '花子', title: 'B2', parentId: 'r', mapType: 'current' }];
const mgMembers = [{ id: 's1', lastName: '試験', firstName: '二郎', title: 'BR', parentId: '' }, { id: 's2', lastName: '仮名', firstName: '三郎', title: 'B3', parentId: 's1' }];
async function goMonth(y, m) {
  w.document.getElementById('selYear').innerHTML = '<option value="' + y + '">' + y + '</option>';
  w.document.getElementById('selYear').value = String(y);
  w.document.getElementById('selMonth').innerHTML = '<option value="' + m + '">' + m + '</option>';
  w.document.getElementById('selMonth').value = String(m);
  w.onYearMonthChange();
  await sleep(400);
}
function shownNames(id) {
  w.openEventEdit(id); // 予定の編集画面（関連メンバーの欄）
  const el = w.document.getElementById('evMemberNames');
  const t = el ? el.textContent : '';
  try { w.closeEventModal && w.closeEventModal(); } catch (e) {}
  return t;
}
T.run(async () => {
  T.login();
  // ── 10月：自分の MAP と共有してくれている人の MAP がある ──
  store['maps/' + T.OWNER + '/months/2026.10_current'] = { members: ownMembers, updatedAt: 'x' };
  store['maps/' + OU + '/months/2026.10_current'] = { members: mgMembers, updatedAt: 'x' };
  store['maps/' + OU + '/months/2026.12_current'] = { members: mgMembers, updatedAt: 'x' };
  store['maps/' + T.OWNER + '/months/2026.12_current'] = { members: ownMembers, updatedAt: 'x' };
  w.state.mergedMaps = [{ uid: OU, graftId: 'r', name: '試験' }];
  await goMonth(2026, 10);
  c('10月：自分のMAPを読んだ', (w.state.members || []).length === 2, (w.state.members || []).length);
  // 10月に、11月の予定を作る（自分のメンバー＋共有メンバーを関連メンバーに）
  const mid = 'MG_abcdef_s2';
  w.state.events = [{ id: 'ev11', type: 'event', title: '面談', date: '2026-11-05', time: '10:00', memberIds: ['k1', mid], memberId: 'k1', vis: 'both', selfShow: true },
    { id: 'ev01', type: 'event', title: '新年会', date: '2027-01-08', time: '19:00', memberIds: ['k1', mid], memberId: 'k1', vis: 'both', selfShow: true }];
  let t = shownNames('ev11');
  c('10月のうちは名前で出る（前提）', /見本/.test(t) && /仮名/.test(t) && t.indexOf('?') < 0, t);

  // ── 月が変わって11月：自分も共有してくれている人も「翌月へコピー」をしていない ──
  await goMonth(2026, 11);
  c('11月：自分のMAPはまだ無い（翌月へコピーしていない）', (w.state.members || []).length === 0);
  t = shownNames('ev11');
  c('11月：関連メンバーが「?」にならず名前で出る', /見本 ?花子|見本花子/.test(t) && /仮名 ?三郎|仮名三郎/.test(t) && t.indexOf('?') < 0, t);
  c('11月：カレンダーの一覧の名前（自分のメンバー）', w._cvMemNames(w.findEvent('ev11')).join('、').indexOf('見本') >= 0, w._cvMemNames(w.findEvent('ev11')).join('、'));
  c('11月：_evMemNm で共有メンバーの名前', w._evMemNm(mid) === '仮名 三郎', w._evMemNm(mid));
  // 関連メンバーの選択リストに、選んでいる人が出る（外すこともできる）
  w.openEventEdit('ev11'); w.openMemberPick(); await sleep(50);
  const rows = [...w.document.querySelectorAll('#mpList .mp-row')].map(r => r.getAttribute('data-mid'));
  c('11月：選択リストに選んでいる2人が出る', rows.indexOf('k1') >= 0 && rows.indexOf(mid) >= 0, rows.join(','));
  w.closeMemberPick();
  // 保存しても外れない
  w.saveEvent && w.saveEvent(); await sleep(50);
  const e11 = w.findEvent('ev11');
  c('11月：保存しても関連メンバーが外れない', e11 && e11.memberIds.join(',') === 'k1,' + mid, e11 && e11.memberIds.join(','));

  // ── 共有してくれている人だけコピー済み・自分はまだ（11月に相手のMAPだけある） ──
  store['maps/' + OU + '/months/2026.11_current'] = { members: mgMembers, updatedAt: 'x' };
  await goMonth(2026, 12); await goMonth(2026, 11);
  t = shownNames('ev11');
  c('11月（相手だけコピー済み）：名前で出る', /見本/.test(t) && /仮名/.test(t) && t.indexOf('?') < 0, t);

  // ── 翌月へコピーした後（自分も11月がある）：今までどおり ──
  store['maps/' + T.OWNER + '/months/2026.11_current'] = { members: ownMembers, updatedAt: 'x' };
  await goMonth(2026, 12); await goMonth(2026, 11);
  c('11月（コピー後）：自分のMAPを読んだ', (w.state.members || []).length === 2);
  t = shownNames('ev11');
  c('11月（コピー後）：名前で出る', /見本/.test(t) && /仮名/.test(t) && t.indexOf('?') < 0, t);

  // ── 年またぎ：12月に作った1月の予定 → 2027年1月（どちらもコピーしていない） ──
  await goMonth(2027, 1);
  c('2027年1月：自分のMAPはまだ無い', (w.state.members || []).length === 0);
  t = shownNames('ev01');
  c('2027年1月：関連メンバーが名前で出る（年またぎ）', /見本/.test(t) && /仮名/.test(t) && t.indexOf('?') < 0, t);

  // ── メンバーを消した時：前の月にもいない人は今までどおり「?」（勝手に別の人の名前を出さない） ──
  w.state.events.push({ id: 'evx', type: 'event', title: '消した人', date: '2027-01-09', memberIds: ['zz'], memberId: 'zz' });
  t = shownNames('evx');
  c('どこにもいない人は「?」のまま', t === '?', t);
  // 前の月で「削除」にした人は、削除前の名前で出る（予定から外れて見えない）
  store['maps/' + T.OWNER + '/months/2026.12_current'] = { members: ownMembers.concat([{ id: 'd1', lastName: '削除', firstName: '済子', deleted: true, parentId: 'r' }]), updatedAt: 'y' };
  w.state.events.push({ id: 'evd', type: 'event', title: '消した人2', date: '2027-01-10', memberIds: ['d1'], memberId: 'd1' });
  await goMonth(2026, 12); await goMonth(2027, 1);
  t = shownNames('evd');
  c('前の月に削除した人も名前で出る', /削除/.test(t), t);

  // 読み取りの回数：同じ月をもう一度開いても前の月を読み直さない
  await goMonth(2026, 12); await goMonth(2027, 1);
  const n0 = reads.filter(p => /2026\.12_current/.test(p)).length;
  shownNames('ev01'); shownNames('ev01'); await sleep(100);
  const n1 = reads.filter(p => /2026\.12_current/.test(p)).length;
  c('名前を引くたびに前の月を読み直さない', n1 === n0, n0 + '→' + n1);
});
