// v621：ログインで「…」のまま止まらない（プロフィールが読めない時は理由と修復ボタン）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  c('起動時にログインの見張りが登録される', typeof T.authCb === 'function');
  const ls = $('#loginScreen');
  ls.style.display = 'flex';
  $('#loginEmail').value = 'a@example.com'; $('#loginPass').value = 'xxxxxx';
  // ① プロフィールが読めない（通信エラー）
  let tries = 0;
  const g0 = T.dbStub.doc;
  T.dbStub.doc = p => { const d = g0(p); if (/^users\//.test(p)) d.get = () => { tries++; return Promise.reject({ code: 'unavailable' }); }; return d; };
  w.localStorage.removeItem('gm_lastProfile');
  T.signIn = () => { setTimeout(() => T.authCb({ uid: 'u1' }), 0); return Promise.resolve(); };
  w.doLogin(); await sleep(10);
  c('押した直後は「...」', $('#loginForm button').textContent === '...');
  await sleep(4000);
  c('読めない時は3回まで読み直す', tries === 3, tries);
  c('止まらずにボタンが戻る', $('#loginForm button').textContent === 'ログイン' && !$('#loginForm button').disabled);
  c('理由と修復ボタンが出る', $('#loginError').style.display !== 'none' && $('#loginError').textContent.indexOf('unavailable') >= 0 && $('#loginError').textContent.indexOf('修復') >= 0);
  // ② 2回目で読めたら入れる
  tries = 0;
  T.dbStub.doc = p => { const d = g0(p); if (/^users\//.test(p)) d.get = () => { tries++; return tries < 2 ? Promise.reject({ code: 'unavailable' }) : Promise.resolve({ exists: true, data: () => ({ name: 'テスト', status: 'active', union: 'GRANT', area: '福岡', upRuby: 'a', upBd: 'b', unionSelectedV2: true }) }); }; return d; };
  w.doLogin(); await sleep(2500);
  c('読み直しで入れる', ls.style.display === 'none' && w.currentUser && w.currentUser.uid === 'u1');
  // ③ ログイン自体が返ってこない
  ls.style.display = 'flex'; T.signIn = null;
  const st = w.setTimeout; let fired = null;
  w.setTimeout = (f, ms) => (ms === 20000 ? (fired = f, 0) : st(f, ms));
  w.doLogin(); w.setTimeout = st;
  c('20秒の見張りを置く', typeof fired === 'function');
  fired && fired();
  c('20秒たつと案内と修復ボタン', $('#loginForm button').textContent === 'ログイン' && $('#loginError').textContent.indexOf('時間がかかっています') >= 0);
  c('修復の関数がある', typeof w.gmRepair === 'function');
});
