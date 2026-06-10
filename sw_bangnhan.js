/* Bé Học Bảng Nhân - GitHub Pages PWA Service Worker */
const BANGNHAN_CACHE = "bangnhan-v8-final-20260610-01";
const CORE_ASSETS = [
  "./",
  "./hocbangnhan.html",
  "./manifest_bangnhan.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(BANGNHAN_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== BANGNHAN_CACHE) return caches.delete(key);
        return Promise.resolve();
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Chỉ xử lý cùng origin GitHub Pages, không can thiệp request ngoài.
  if (url.origin !== self.location.origin) return;

  // HTML: network-first để khi anh cập nhật GitHub thì người dùng nhận bản mới.
  if (req.mode === "navigate" || url.pathname.endsWith("/hocbangnhan.html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(BANGNHAN_CACHE).then((cache) => cache.put("./hocbangnhan.html", copy));
          return res;
        })
        .catch(() => caches.match("./hocbangnhan.html"))
    );
    return;
  }

  // Asset tĩnh: cache-first cho mở nhanh/offline.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(BANGNHAN_CACHE).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
