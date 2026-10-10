// v770：受付（BASE CHECK-IN）の名簿で「無効」にした人は、NAVIGATORも使えなくなる（アカウント管理で名簿と紐付け）
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
const fs = require('fs'), p = require('path'), R = p.join(__dirname, '../../..');
T.run(async () => {
  T.login();
  const roster = { '101': { name: '天城 蓮司', union: 'GRANT', active: false }, '102': { name: '氷室 凛花', union: 'GRANT', active: true }, '103': { name: '朝倉玲奈', union: 'GRANT' } };
  const writes = [];
  const d0 = T.dbStub.doc;
  const col = (path) => {
    const base = T.dbStub.collection(path);
    if (path === 'checkinUnions') base.get = () => Promise.resolve({ forEach(f) { f({ id: 'GRANT', data: () => ({ area: '福岡' }) }); f({ id: 'LIEN', data: () => ({}) }); } });
    if (path === 'checkinMembers') base.get = () => Promise.resolve({ forEach(f) { Object.keys(roster).forEach(k => f({ id: k, data: () => Object.assign({}, roster[k]) })); } });
    return base;
  };
  w.db = Object.assign({}, T.dbStub, {
    doc(path) {
      const r = d0(path);
      const m = path.match(/^checkinMembers\/(.+)$/);
      if (m) r.get = () => Promise.resolve({ exists: !!roster[m[1]], data: () => Object.assign({}, roster[m[1]]) });
      r.set = (d) => { writes.push([path, d]); return Promise.resolve(); };
      return r;
    },
    collection: col,
  });
  w.localStorage.clear();
  const pv = { ver: w.PRIVACY_VER, at: 'x' };
  const gate = () => $('#approvalGate');

  // ① 紐付いた名簿が受付で無効 → ゲート
  const u1 = { uid: 'u1', name: '天城 蓮司', union: 'GRANT', status: 'active', privacy: pv, ckNo: '101' };
  w.loginSuccess(u1); await sleep(30);
  c('受付で無効の人はゲートが出る', !!gate() && /受付システム.*無効/.test(gate().textContent), gate() && gate().textContent.slice(0, 60));
  c('無効の結果を端末に覚える', w.localStorage.getItem('gm_ckOff_u1') === '101');
  // ② 次に開いた時はすぐゲート → 受付で有効に戻っていれば入れる
  w.closeApprovalGate();
  roster['101'].active = true;
  w.loginSuccess(u1);
  c('前回無効だった人は、読み込みを待たずにすぐゲート', !!gate());
  await sleep(30);
  c('受付で有効に戻すと入れる（ゲートが閉じる・覚えも消える）', !gate() && w.localStorage.getItem('gm_ckOff_u1') === null);
  // ③ 対象外：紐付けなし・管理者・オーナー・名簿に無い番号
  roster['101'].active = false;
  w.loginSuccess({ uid: 'u2', name: 'x', status: 'active', privacy: pv }); await sleep(30);
  c('紐付けのない人は今までどおり使える', !gate());
  w.loginSuccess({ uid: 'u3', name: 'x', status: 'active', role: 'admin', privacy: pv, ckNo: '101' }); await sleep(30);
  c('管理者（ユニオンリーダー）は止めない', !gate());
  w.loginSuccess({ uid: T.OWNER, name: 'x', privacy: pv, ckNo: '101' }); await sleep(30);
  c('オーナーは止めない', !gate());
  w.loginSuccess({ uid: 'u4', name: 'x', status: 'active', privacy: pv, ckNo: '999' }); await sleep(30);
  c('名簿に無い番号は止めない', !gate());
  // ④ 読めない時（オフライン等）は止めない
  const g0 = w.db.doc;
  w.db.doc = (path) => { const r = g0(path); if (/^checkinMembers/.test(path)) r.get = () => Promise.reject(new Error('offline')); return r; };
  w.loginSuccess(Object.assign({}, u1, { uid: 'u5' })); await sleep(30);
  c('名簿を読めない時は止めない', !gate());
  w.db.doc = g0;
  w.currentUser = { uid: T.OWNER, name: '山内北斗', area: '福岡', union: 'GRANT' };

  // ⑤ アカウント管理で紐付け
  w._adminUsers = [{ id: 'a1', name: '氷室凛花', union: 'GRANT', area: '福岡', email: 'h@x' }, { id: 'a2', name: '天城 蓮司', union: 'GRANT', ckNo: '101' }, { id: T.OWNER, name: 'オーナー' }];
  w.document.getElementById('adminPanel').classList.add('open');
  w.renderAdminList(); w._admCkLoad(); await sleep(30);
  const rows = $$('#adminBody .adm-row');
  c('一覧に「受付の名簿と紐付ける」', rows.some(r => /受付の名簿と紐付ける/.test(r.textContent)));
  c('紐付け済みは番号・名前・「受付で無効」', rows.some(r => /受付 101 天城 蓮司/.test(r.textContent) && /受付で無効/.test(r.textContent)));
  c('オーナーの行には出さない', !rows.some(r => /オーナー/.test(r.querySelector('.adm-name').textContent) && r.querySelector('.adm-ck')));
  w.admCkOpen('a1'); await sleep(30);
  const L = $$('#admCkOv .adm-ck-row');
  c('紐付けの画面に名簿が出る', !!$('#admCkOv') && L.length === 3);
  c('同じ名前の人が先頭（スペースの有無は無視）', L[0] && L[0].dataset.no === '102' && /同じ名前/.test(L[0].textContent));
  c('無効の人には「無効」', L.some(r => r.dataset.no === '101' && /無効/.test(r.textContent)));
  c('オーナーはユニオンを切り替えられる', $$('#admCkOv select option').length === 2);
  w._admCkP.q = '玲奈'; w._admCkList();
  c('名前で検索できる', $$('#admCkOv .adm-ck-row').length === 1);
  w._admCkP.q = ''; w._admCkList();
  L[0].click(); await sleep(20);
  const wr = writes.find(x => x[0] === 'users/a1');
  c('選ぶとアカウントに番号を保存', wr && wr[1].ckNo === '102' && wr[1].ckSetBy === T.OWNER);
  c('画面が閉じて一覧に反映', !$('#admCkOv') && $$('#adminBody .adm-row').some(r => /受付 102 氷室 凛花/.test(r.textContent)));
  w.admCkOpen('a2'); await sleep(30);
  c('紐付け済みの人は「紐付けを外す」', /紐付けを外す/.test($('#admCkOv').textContent));
  w.admCkPick(''); await sleep(20);
  c('外すと番号を空に', writes.some(x => x[0] === 'users/a2' && x[1].ckNo === ''));
  w.closeAdminPanel();

  // ⑥ ルール
  const rules = fs.readFileSync(R + '/firestore.rules', 'utf8');
  c('ルール：本人は紐付いた自分の名簿だけ読める', /match \/checkinMembers\/\{no\}[\s\S]{0,500}get\('ckNo', ''\) == no/.test(rules));
  c('v786 ルール：名簿で無効の人は無効化と同じ（notDisabled が rosterOff を見る・オーナーと管理者は除く）', /function notDisabled\(uid\) \{[^}]*!rosterOff\(uid\)/.test(rules) && /function rosterOff\(uid\)[\s\S]{0,700}get\('role', ''\) != 'admin'[\s\S]{0,300}checkinMembers\/\$\(no\)\)\.data\.get\('active', true\) == false/.test(rules));
  c('ルール：本人は紐付け（ckNo）を変えられない', /isSelf\(uid\)[\s\S]{0,300}get\('ckNo',''\)\s*== resource\.data\.get\('ckNo',''\)/.test(rules) && /!\('ckNo' in request\.resource\.data\)/.test(rules));
});
