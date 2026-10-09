// v771：ログイン状態の保持（ATTACK LIST・GOAL SETTING と同じ）。PC＝SESSION（閉じたらログアウト）／スマホ・タブレット＝LOCAL
// 端末ごとに jsdom を立ち上げ直して、起動時の setPersistence を確かめる
const { execFileSync } = require('child_process');
if (process.argv[2]) {
  const [ua, touch] = JSON.parse(process.argv[2]);
  const T = require('../lib/head.js')({ ua, touch });
  T.run(async () => { console.log('RESULT ' + JSON.stringify({ p: T.persist, m: T.w._authMobileDev() })); }, 600);
  return;
}
const fails = [];
const c = (n, ok, x) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (x ? '  [' + x + ']' : '')); if (!ok) fails.push(n); };
const run = (ua, touch) => {
  const out = execFileSync(process.execPath, [__filename, JSON.stringify([ua, touch])], { encoding: 'utf8', timeout: 60000 });
  const m = out.match(/RESULT (.+)/); return m ? JSON.parse(m[1]) : {};
};
const W = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
let r;
r = run(W, 0); c('Windows PC → SESSION（閉じたらログアウト）', r.p === 'session' && r.m === false, JSON.stringify(r));
r = run(MAC, 0); c('Mac（タッチなし）→ SESSION', r.p === 'session' && r.m === false, JSON.stringify(r));
r = run(MAC, 5); c('iPad（UAがMacintosh・タッチ点5）→ LOCAL', r.p === 'local' && r.m === true, JSON.stringify(r));
r = run(IPH, 5); c('iPhone → LOCAL', r.p === 'local', JSON.stringify(r));
r = run(AND, 5); c('Android → LOCAL', r.p === 'local', JSON.stringify(r));
const src = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
c('ログイン・新規登録は保持の種類を決めてから', /_authPersistReady\.then\(function\(\) \{ return auth\.signInWithEmailAndPassword/.test(src) && /_authPersistReady\.then\(function\(\) \{ return auth\.createUserWithEmailAndPassword/.test(src));
console.log(fails.length ? 'NG ' + fails.length : 'ALL PASS');
process.exit(fails.length ? 1 : 0);
