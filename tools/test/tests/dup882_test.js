// v882：アカウント管理（オーナー）で、同じ名前でメールアドレス違いのアカウントを見比べて削除（使えなくして一覧から消す・元に戻せる）。
//   あわせて「パスワードを忘れた方はこちら」の動き（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const ago = d => new w.Date(w.Date.now() - d * 86400000).toISOString();
  w._adminUsers = [
    { id: 'u1', name: '見本 はなこ', email: 'hanako@example.com', union: 'REVE', status: 'active', lastSeenAt: ago(1) },
    { id: 'u2', name: '見本　はなこ', email: 'hanako2@example.com', union: 'REVE', status: 'pending', lastSeenAt: ago(40) },
    { id: 'u3', name: '見本 太郎', email: 'taro@example.com', union: 'REVE', status: 'active' },
    { id: 'u4', name: '見本 管理', email: 'adm1@example.com', union: 'REVE', status: 'active', role: 'admin' },
    { id: 'u5', name: '見本 管理', email: 'adm2@example.com', union: 'REVE', status: 'active' }
  ];
  const writes = []; const fs0 = w.fsSet; w.fsSet = (p, d) => { writes.push([p, JSON.parse(JSON.stringify(d))]); return Promise.resolve(); };
  const cf0 = w.confirm; const asks = []; w.confirm = m => { asks.push(m); return true; };
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'acc'; w._admPg = ''; w._admF = 'all';
  w.renderAdminList();
  let html = $('#adminBody').innerHTML;
  c('「同じ名前が複数」の絞り込み（空白の違いも同じ名前・4人）', /同じ名前が複数<b>4<\/b>/.test(html), (html.match(/同じ名前が複数<b>\d+/) || [])[0]);
  c('同じ名前の人の行に「同じ名前のアカウントが2件」と最後に開いた日', /同じ名前のアカウントが2件/.test(html) && /最終ログイン/.test(html));
  c('削除ボタンは同じ名前の人だけ・管理者には出さない', /admDelUser\('u1'\)/.test(html) && /admDelUser\('u2'\)/.test(html) && !/admDelUser\('u3'\)/.test(html) && !/admDelUser\('u4'\)/.test(html) && /admDelUser\('u5'\)/.test(html));
  w.admF('dup'); html = $('#adminBody').innerHTML;
  c('絞り込むと同じ名前どうしが並ぶ', /見本 はなこ/.test(html) && /hanako2@/.test(html) && !/taro@/.test(html));
  // 削除
  w.admDelUser('u2'); await sleep(20);
  c('確かめる時に、残す方のアカウントも出す', /hanako2@example\.com/.test(asks[0]) && /残す同じ名前のアカウント[\s\S]*hanako@example\.com/.test(asks[0]));
  c('削除＝使えなくして一覧から消す（前の状態も残す）', writes.length === 1 && writes[0][0] === 'users/u2' && writes[0][1].deleted === true && writes[0][1].status === 'disabled' && writes[0][1].deletedFrom === 'pending');
  w.admF('all'); html = $('#adminBody').innerHTML;
  c('削除したアカウントは一覧から消える・人数にも数えない', !/hanako2@/.test(html) && $('#adminCount').textContent === '4人', $('#adminCount').textContent);
  c('残った方は「同じ名前」ではなくなる（削除ボタンも消える）', !/admDelUser\('u1'\)/.test(html));
  c('「削除したアカウント 1」の絞り込みが出る', /削除したアカウント<b>1<\/b>/.test(html));
  w.admF('del'); html = $('#adminBody').innerHTML;
  c('削除したアカウントの一覧に「元に戻す」', /hanako2@/.test(html) && /admUndelUser\('u2'\)/.test(html));
  w.admUndelUser('u2'); await sleep(20);
  c('元に戻すと、前の状態（承認待ち）に戻る', writes[1][0] === 'users/u2' && writes[1][1].deleted === false && writes[1][1].status === 'pending');
  // オーナーでない人には出さない
  w.currentUser.uid = 'someone'; w.currentUser.role = 'admin'; w.currentUser.union = 'REVE';
  c('オーナーでない人には削除も「同じ名前」も出さない', w._admDelBtn(w._adminUsers[0]) === '' && w._admDupLine(w._adminUsers[0]) === '');
  T.login();
  // パスワードを忘れた方はこちら
  w.document.body.insertAdjacentHTML('beforeend', '<input id="loginEmail"><div id="loginError"></div>');
  const sent = []; const auth0 = w.auth;
  w.auth = { sendPasswordResetEmail: (e, o) => { sent.push([e, o]); return Promise.resolve(); } };
  w.document.getElementById('loginEmail').value = '';
  w.showForgotPass(); await sleep(10);
  c('パスワード：メールアドレスが空の時は、先に入れるように案内', /先にメールアドレスを入力/.test($('#loginError').textContent) && sent.length === 0);
  w.document.getElementById('loginEmail').value = 'hanako@example.com';
  w.showForgotPass(); await sleep(10);
  c('パスワード：入れたアドレスに再設定のメールを送る（戻り先は NAVIGATOR）', sent.length === 1 && sent[0][0] === 'hanako@example.com' && /hktymc18\.github\.io\/groove-map\//.test(sent[0][1].url) && /リセットメールを送信しました/.test($('#loginError').textContent));
  w.auth = auth0; w.fsSet = fs0; w.confirm = cf0;
  c('APP_JS_VERSION v882 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 882);
});
