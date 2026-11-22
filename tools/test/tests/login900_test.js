// v900：ログイン画面もトーン表に（大事なボタンはイエロー＋チャコールの字・選んだタブはチャコール・端が半円）。時刻の帯の色はテーマに合わせる
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  const ls = html.slice(html.indexOf('<div id="loginScreen"'), html.indexOf('onclick="doSignup()"') + 400);
  c('ログイン・登録のボタンはイエローの地にチャコールの字・端が半円', (ls.match(/border-radius:999px;background:#EFFF40;color:#373334/g) || []).length === 2);
  c('ログイン画面にターコイズ地＋黒字のボタンが残っていない', !/background:var\(--accent\);color:#000/.test(ls));
  c('入力欄は角を丸く（16px）', !/border-radius:12px;color:var\(--text\)/.test(ls) && /border-radius:16px;color:var\(--text\)/.test(ls));
  const lt = w.document.getElementById('loginTab'), st = w.document.getElementById('signupTab');
  w.switchAuthTab('signup');
  c('新規登録を選ぶとそのタブがチャコール', st.style.background === 'var(--nv-ink)' && lt.style.background === 'transparent');
  w.switchAuthTab('login');
  c('ログインに戻すとログインのタブがチャコール', lt.style.background === 'var(--nv-ink)' && st.style.background === 'transparent');
  const meta = w.document.querySelector('meta[name="theme-color"]');
  w.setTheme('light'); await sleep(20);
  c('ライトでは時刻の帯が明るい色', meta && meta.getAttribute('content') === '#F6F6F1', meta && meta.getAttribute('content'));
  w.setTheme('dark'); await sleep(20);
  c('ダークでは時刻の帯が暗い色', meta && meta.getAttribute('content') === '#1C1A1B');
});
