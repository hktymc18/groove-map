/* GROOVE MAP Service Worker
 * アプリシェルをキャッシュしてインストール可能化＋オフライン起動を実現。
 * HTML はネットワーク優先（デプロイ反映）、失敗時にキャッシュへフォールバック。
 * Firebase/gstatic 等の外部オリジンは素通し（キャッシュしない）。
 * 注意: バージョンを上げたら CACHE 名も更新すること（古いキャッシュを破棄）。 */
var CACHE = 'groove-map-v239';
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
