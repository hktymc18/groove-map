// v856：はじめに1回「通知をオンにしますか？」（許可は本人が押す・あとでは7日後にもう1回まで・iPhoneはホーム画面のアプリだけ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  let perm = 'default', asked = 0;
  w.Notification = function() {}; w.Notification.permission = 'default';
  Object.defineProperty(w.Notification, 'permission', { get: () => perm, configurable: true });
  w.Notification.requestPermission = (cb) => { asked++; perm = 'granted'; if (cb) cb('granted'); return Promise.resolve('granted'); };
  w.fcmRegister = () => Promise.resolve(true); w.showBrowserNotif = () => {}; w.checkReminders = () => {};
  w._gdAutoOk = () => true; w._gdBusy = () => false;
  w.localStorage.removeItem('gm_ntfAsk'); w.localStorage.removeItem('gm_pushOff');
  const ov = () => $('#ntfAskOv');
  // ① まだ聞いていない端末に出す
  w._ntfAskCheck(0); await sleep(10);
  c('まだ聞いていない時に「通知をオンにしますか？」', !!ov() && /通知をオンにしますか/.test(ov().textContent) && /オンにする/.test(ov().textContent) && /あとで/.test(ov().textContent));
  c('2つ出さない', (w._ntfAskCheck(0), $$('#ntfAskOv').length === 1));
  // ② オンにする → 許可の確認が出て、登録される
  ov().querySelector('.go').click(); await sleep(20);
  c('オンにする → 端末の「許可しますか？」', asked === 1 && !ov());
  c('許可したら、もう聞かない', (w._ntfAskCheck(0), !ov()));
  // ③ あとで → 7日後にもう1回だけ
  perm = 'default'; w.localStorage.removeItem('gm_ntfAsk');
  w._ntfAskCheck(0); await sleep(5); ov().querySelector('.lt').click(); await sleep(5);
  c('あとでは閉じる', !ov() && JSON.parse(w.localStorage.getItem('gm_ntfAsk')).n === 1);
  w._ntfAskCheck(0); await sleep(5);
  c('7日たつまでは聞かない', !ov());
  const s = JSON.parse(w.localStorage.getItem('gm_ntfAsk')); s.at = w.Date.now() - 8 * 86400000; w.localStorage.setItem('gm_ntfAsk', JSON.stringify(s));
  w._ntfAskCheck(0); await sleep(5);
  c('7日たったらもう1回', !!ov()); ov().querySelector('.lt').click(); await sleep(5);
  const s2 = JSON.parse(w.localStorage.getItem('gm_ntfAsk')); s2.at = w.Date.now() - 30 * 86400000; w.localStorage.setItem('gm_ntfAsk', JSON.stringify(s2));
  w._ntfAskCheck(0); await sleep(5);
  c('聞くのは2回まで', !ov());
  // ④ 出さない時
  w.localStorage.removeItem('gm_ntfAsk');
  perm = 'denied'; w._ntfAskCheck(0); await sleep(5);
  c('「許可しない」を選んだ端末には出さない', !ov());
  perm = 'default'; w.localStorage.setItem('gm_pushOff', '1'); w._ntfAskCheck(0); await sleep(5);
  c('設定で自分でオフにした人には出さない', !ov());
  w.localStorage.removeItem('gm_pushOff');
  Object.defineProperty(w.navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', configurable: true });
  w._ntfAskCheck(0); await sleep(5);
  c('iPhoneのSafari（ホーム画面のアプリでない）には出さない', !ov());
  Object.defineProperty(w.navigator, 'standalone', { value: true, configurable: true });
  w._ntfAskCheck(0); await sleep(5);
  c('iPhoneのホーム画面のアプリには出す', !!ov());
  w.ntfAskClose();
  // ⑤ ほかの画面（案内・更新のお知らせ）が出ている時は待つ
  w.localStorage.removeItem('gm_ntfAsk'); w._gdBusy = () => true;
  w._ntfAskCheck(0); await sleep(5);
  c('ほかの案内が出ている時は出さない（あとでもう一度）', !ov() && !w.localStorage.getItem('gm_ntfAsk'));
  w._gdBusy = () => false; w._gdAutoOk = () => false; w._ntfAskCheck(0); await sleep(5);
  c('共有MAPを見ている時などは出さない', !ov());
  // ⑥ ログインの後に呼ばれる
  c('ログインの後に聞く', /_ntfAskCheck\(0\)/.test(w.loginSuccess.toString()));
});
