// Service Worker: オフライン対応（キャッシュ）
const CACHE = "todo-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

// インストール時：必要なファイルを「HTTPキャッシュ無視」で取得してキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(ASSETS.map((u) => new Request(u, { cache: "no-store" })))
    )
  );
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// リクエスト時：ネットワーク優先。ただし fetch は no-store で行い、
// iOS内部のHTTPキャッシュも無視して「常に本当の最新」を取得する。
// 失敗（オフライン）時のみキャッシュから返す。取得成功時はキャッシュも更新。
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(new Request(req.url, { cache: "no-store" }))
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
