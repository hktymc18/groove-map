/* NAVIGATOR Beauty: ユーザーのカードのスマホの通知（受付 v129）
 * 範囲は /groove-map/checkin/ だけ。ページの読み込みには関わらない（fetch は扱わない）。
 * 通知を受け取る、を押したユーザーのカードだけがこのファイルを登録する（ビジネスの会員証・受付の画面は登録しない）。
 * 通知はサーバーが notification 付きで送るので、表示と、タップした時にカードを開くのは Firebase の仕組みがする。
 * notification の無いデータだけの通知の時だけ、ここで表示する。 */
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyBHLz19p4wsSi043V0hhE-Crjwv6VBKBro",
    authDomain: "hotlist-21865.firebaseapp.com",
    projectId: "hotlist-21865",
    storageBucket: "hotlist-21865.firebasestorage.app",
    messagingSenderId: "565556414915",
    appId: "1:565556414915:web:f8c3489260e8d9d6e49576"
  });
  firebase.messaging().onBackgroundMessage(function (p) {
    if (p && p.notification && (p.notification.title || p.notification.body)) return;   // 自動で出る（2通にしない）
    var d = (p && p.data) || {};
    return self.registration.showNotification(d.title || 'NAVIGATOR Beauty', {
      body: d.body || '', icon: './icon-192.png', badge: './icon-192.png', tag: d.tag || 'nb', data: { url: d.url || './' }
    });
  });
} catch (e) {}
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function (e) {
  var d = (e.notification && e.notification.data) || {};
  if (d.FCM_MSG) return;   // Firebase の通知は Firebase がカードを開く
  e.notification.close();
  var url = d.url || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url === url && 'focus' in list[i]) return list[i].focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
