// v726：#4 自分だけのメモ（共有したMAPでも、相手には見えない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const writes = [], reads = [];
  const odoc = w.db.doc.bind(w.db);
  w.db.doc = (p) => /pmemo_/.test(p) ? { set: (d) => { writes.push([p, JSON.parse(JSON.stringify(d))]); return Promise.resolve(); } } : odoc(p);
  const ofg = w.fsGet; w.fsGet = (p) => { if (/pmemo_/.test(p)) { reads.push(p); return Promise.resolve(/pmemo_own1/.test(p) ? { notes: { a: '前に書いた自分用' } } : null); } return ofg(p); };
  w.state.members = [{ id: 'r', lastName: '嶽本', firstName: '', title: 'ゴールド', parentId: '', mapType: 'both' }, { id: 'a', lastName: '田中', firstName: '健', title: 'B1', parentId: 'r', mapType: 'both', memo: '共有のメモ' }];
  w.state.isEditor = true; w.viewingOwnerUid = 'own1';
  w.switchView('current'); await sleep(30);
  w.uxMem('a', 'map'); await sleep(40);
  const me = w.currentUser.uid;
  c('MAPの人の画面に「🔒 自分だけのメモ」（共有元には見えない）', !!$('.pm-box.ux') && /共有元の人には見えません/.test($('.pm-box.ux').textContent));
  c('自分の場所から読む（users/自分/appData/pmemo_持ち主）', reads.indexOf('users/' + me + '/appData/pmemo_own1') >= 0 && $('#pmIn_ux').value === '前に書いた自分用');
  const ta = $('#pmIn_ux'); ta.value = '紹介者の情報（自分だけ）'; ta.oninput(); await sleep(900);
  const wr = writes[writes.length - 1];
  c('書くと自分の場所に保存', !!wr && wr[0] === 'users/' + me + '/appData/pmemo_own1' && wr[1].notes.a === '紹介者の情報（自分だけ）');
  c('メンバーのメモ（共有される方）は変えない', w.state.members[1].memo === '共有のメモ');
  w.uxMemClose && w.uxMemClose();
  w._meOpen('a'); await sleep(40); // v783: 今までの編集画面（裏方）
  c('編集画面にも（共有のメモの下）', !!$('#fPMemoWrap .pm-box') && $('#pmIn_ed').value === '紹介者の情報（自分だけ）' && /共有している人にも見えます/.test($('#fMemo').placeholder));
  w.closeModal && w.closeModal();
  w.ppOpen('a'); await sleep(20); w._pp.pg = 'memo'; w._ppRender(); await sleep(30);
  c('かんたん編集のメモのページにも', !!$('.pm-box.pp') && /共有している人にも見えます/.test(w.document.body.textContent));
  w.viewingOwnerUid = null; await sleep(10);
  c('自分のMAPでは別の場所（pmemo_自分）', w._pmPath(w._pmOwner()) === 'users/' + me + '/appData/pmemo_' + me);
});
