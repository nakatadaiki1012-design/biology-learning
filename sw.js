/* 生物ラボ：オフラインでも開けるようにする（Service Worker）
   ・ページ（index.html）は「ネットを先に」→ 更新がすぐ反映される。つながらないときは保存したものを使う
   ・js / css（?v=版番号つき）は「保存したものを先に」→ 速い。版番号が変われば新しいファイルを取りにいく
   ・クラス対戦のデータベースなど、ほかのサイトへの通信にはさわらない */
var CACHE = 'biolab-1';
function assetsOf(html) { var out = [], re = /(?:src|href)="((?:js|css)\/[^"]+)"/g, m; while ((m = re.exec(html))) out.push(m[1]); return out; }
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return fetch('./', { cache: 'no-cache' }).then(function (r) { return r.clone().text().then(function (t) { return c.put('./', r).then(function () { return c.addAll(assetsOf(t).concat(['manifest.webmanifest', 'icon.svg', 'icon-192.png'])); }); }); });
  }).catch(function () {}));
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) {
        c.put('./', copy.clone());
        copy.text().then(function (t) { var keep = assetsOf(t).map(function (a) { return new URL(a, location.href).href; }); c.keys().then(function (ks) { ks.forEach(function (k) { if (/\?v=/.test(k.url) && keep.indexOf(k.url) < 0) c.delete(k); }); }); });
      });
      return r;
    }).catch(function () { return caches.match('./'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
