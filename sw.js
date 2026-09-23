/* GROOVE MAP Service Worker
 * アプリシェルをキャッシュしてインストール可能化＋オフライン起動を実現。
 * v511: HTML はキャッシュから即表示し、裏でネットワークから最新版を取得してキャッシュを更新
 *       （従来のネットワーク優先は毎回1.8MBのダウンロード完了まで画面が出なかった）。
 *       新バージョンは sw.js の更新検知→アプリ側の「新しいバージョンがあります」バナーで反映。
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
    // v382: notification付き配信はSDK/OSが自動表示するため、ここでも表示すると同じ通知が2通になる。
    //        手動表示はデータのみのメッセージに限定（v330以降サーバーは常にnotification付きで送信）。
    if (payload && payload.notification && (payload.notification.title || payload.notification.body)) return;
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
  // v410: 定時リマインダー（eventId='due-digest'）はToDo一覧を開く
  if (evId.indexOf('due') === 0) evId = '';
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

var CACHE = 'groove-map-v514';
var APP_JS = './app.js?v=v514'; // v512: アプリ本体（index.htmlの<script src>と同じURL）
var ASSETS = [
  './',
  './index.html',
  APP_JS,
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];
/* v451: オフライン起動用にFirebase SDK（バージョン固定URL）もキャッシュ。
 * これが無いと機内モード等でSDKが読めず、認証・データ層ごと初期化に失敗して
 * ログイン画面のまま何もできなかった。URL固定なのでキャッシュ優先でも安全
 * （SDK更新時はURLが変わる＝自動で新しい方を取得）。 */
var SDK_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all([
        // v511: HTTPキャッシュを経由せず必ず最新を取得（新SWのキャッシュに古いHTMLが入らないように）
        c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); })).catch(function () {}),
        // v451: SDKはno-corsで取得（opaqueレスポンスでも<script>読み込みには使える）
        Promise.all(SDK_ASSETS.map(function (u) {
          return c.add(new Request(u, { mode: 'no-cors' })).catch(function () {});
        }))
      ]);
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
  // v451: Firebase SDK（バージョン固定URL）はキャッシュ優先＝オフラインでも起動できる
  if (SDK_ASSETS.indexOf(url.href) >= 0) {
    e.respondWith(
      caches.match(req).then(function (m) {
        return m || fetch(new Request(url.href, { mode: 'no-cors' })).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(url.href, copy); });
          return res;
        });
      })
    );
    return;
  }
  // 外部オリジン（Firestore通信/gstatic/fonts等）はそのままネットワークへ
  if (url.origin !== self.location.origin) return;

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') >= 0;

  if (isHTML) {
    // v511: キャッシュ優先で即表示＋裏で最新版を取得してキャッシュを更新（stale-while-revalidate）。
    // パスワード再設定などクエリ付きのURLも同じアプリ本体を返す（中身は1ファイルのため）。
    var fresh = fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      }
      return res;
    });
    e.respondWith(
      caches.match('./index.html').then(function (m) {
        if (m) {
          e.waitUntil(fresh.catch(function () {}));
          return m;
        }
        return fresh.catch(function () { return caches.match(req); });
      })
    );
    return;
  }

  // 同一オリジンのapp.js・アイコン等はキャッシュ優先（app.jsは版ごとにURLが変わる）
  // v512: 404などエラー応答はキャッシュしない（アップロード途中の欠落を固定化しないため）
  e.respondWith(
    caches.match(req).then(function (m) {
      return m || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return m; });
    })
  );
});
