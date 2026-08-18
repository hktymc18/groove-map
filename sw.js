/* GROOVE MAP Service Worker
 * アプリシェルをキャッシュしてインストール可能化＋オフライン起動を実現。
 * HTML はネットワーク優先（デプロイ反映）、失敗時にキャッシュへフォールバック。
 * Firebase/gstatic 等の外部オリジンは素通し（キャッシュしない）。
 * 注意: バージョンを上げたら CACHE 名も更新すること（古いキャッシュを破棄）。 */
/* ── CAL-4: プッシュ通知（FCM）バックグラウンド受信 ──
 * データメッセージ {data:{title,body}} を受けてOS通知を表示。
 * 読み込み失敗（オフライン更新時など）でもSW本体は動くよう try/catch。 */
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
  var _fcm = firebase.messaging();
  _fcm.onBackgroundMessage(function (payload) {
    var n = (payload && payload.notification) || {};
    var d = (payload && payload.data) || {};
    var title = n.title || d.title || 'GROOVE MAP';
    var body = n.body || d.body || '';
    return self.registration.showNotification(title, {
      body: body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'gm-' + (d.eventId || 'push'),
      data: { url: './', eventId: d.eventId || '' }
    });
  });
} catch (e) {}

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  // v307: 通知タップ→アプリを開き、該当予定の詳細シートを表示
  // v330: notification付き配信（FCM自動表示）の場合は data.FCM_MSG.data 側に入る
  var d = (e.notification && e.notification.data) || {};
  var evId = d.eventId || (d.FCM_MSG && d.FCM_MSG.data && d.FCM_MSG.data.eventId) || '';
  // v351: 期限まとめ通知→ToDoの今日一覧へ / v358: dataが落ちる環境向けにタグ(gm-due〜)でも判定
  var tg = (e.notification && e.notification.tag) || '';
  var isTodo = !evId && (!!d.todo || tg.indexOf('gm-due') === 0);
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) {
          try { list[i].postMessage(isTodo ? { type: 'gmOpenTodo' } : { type: 'gmOpenEvent', eventId: evId }); } catch (err) {}
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('./' + (evId ? '?ev=' + encodeURIComponent(evId) : (isTodo ? '?todo=1' : '')));
    })
  );
});

var CACHE = 'groove-map-v362';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // 外部オリジン（Firebase/Firestore/gstatic/fonts等）はそのままネットワークへ
  if (url.origin !== self.location.origin) return;

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') >= 0;

  if (isHTML) {
    // HTML はネットワーク優先（更新を確実に反映）。失敗時のみキャッシュ。
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) {
          return m || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 同一オリジンのアイコン等はキャッシュ優先
  e.respondWith(
    caches.match(req).then(function (m) {
      return m || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return m; });
    })
  );
});
