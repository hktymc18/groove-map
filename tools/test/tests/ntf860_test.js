// v860：設定の通知は最初から「オン」（自分でオフにした時だけオフ。許可がまだの端末は、許可のボタンを出す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  let perm = 'default', asked = 0;
  w.Notification = function() {};
  Object.defineProperty(w.Notification, 'permission', { get: () => perm, configurable: true });
  w.Notification.requestPermission = (cb) => { asked++; perm = 'granted'; if (cb) cb('granted'); return Promise.resolve('granted'); };
  w.fcmRegister = () => Promise.resolve(true); w.showBrowserNotif = () => {}; w.checkReminders = () => {};
  w.localStorage.removeItem('gm_pushOff');
  const pg = () => ($('#setPg') || {}).textContent || '';
  const sel = () => Array.from(w.document.querySelectorAll('#setPg .ppb span.on')).map(x => x.textContent).join(',');
  // ① 許可がまだの端末
  w.setOpen(); await sleep(20);
  c('設定の一覧：通知は「オン」（許可がまだ）', /通知オン（この端末の許可がまだ）/.test(pg()));
  w.setOpen('ntf'); await sleep(20);
  c('通知の画面：最初から「オン」が選ばれている', sel() === 'オン');
  c('許可がまだの時は「この端末で通知を受け取る」ボタン', /この端末の許可がまだです/.test(pg()) && /この端末で通知を受け取る/.test(pg()));
  Array.from(w.document.querySelectorAll('#setPg .ux-nx')).find(x => /受け取る/.test(x.textContent)).click(); await sleep(30);
  c('ボタンを押すと端末の「許可しますか？」', asked === 1 && perm === 'granted');
  w.setOpen('ntf'); await sleep(20);
  c('許可したら「オン」でボタンは消える', sel() === 'オン' && !/この端末の許可がまだです/.test(pg()));
  // ② 自分でオフにした時だけオフ
  w.pushSetEnabled(false); await sleep(10); w.closeCalSettings && w.closeCalSettings();
  w.setOpen('ntf'); await sleep(20);
  c('自分でオフにしたらオフ', sel() === 'オフ');
  w.setOpen(); await sleep(20);
  c('一覧もオフ', /通知オフ/.test(pg()));
  // ③ カレンダーの⋯設定も同じ
  perm = 'default'; w.localStorage.removeItem('gm_pushOff'); w.setClose();
  w.openCalSettings(); await sleep(20);
  const _all = w.document.querySelectorAll('#calSetOv'), cs = _all[_all.length - 1], on = cs && Array.from(cs.querySelectorAll('.rb.sel')).some(x => /オン/.test(x.textContent) && /pushSetEnabled\(true\)/.test(x.getAttribute('onclick')));
  c('カレンダーの設定も最初から「オン」＋許可がまだの案内', on && /この端末の許可がまだです/.test(cs.textContent));
  w.closeCalSettings();
  // ④ ブロック中
  perm = 'denied'; w.setOpen(); await sleep(20);
  c('端末でブロックしている時は「ブロック中」', /通知ブロック中/.test(pg()));
});
