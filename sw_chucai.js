/* Bé Học Chữ Cái Tiếng Việt - PWA Service Worker - FINAL CLEAN PWA
   Upload this file as repo root /sw_chucai.js
   App file: /hoccungducphuc.html
*/
const CHUCAI_CACHE = "chucai-final-pwa-max-voice-20260612-01";

const CORE_ASSETS = [
  "./",
  "./hoccungducphuc.html",
  "./manifest_chucai.json",
  "./icon-192.png",
  "./icon-512.png"
];

async function cacheCore() {
  const cache = await caches.open(CHUCAI_CACHE);
  await cache.addAll(CORE_ASSETS.map(u => new Request(u, { cache: "reload" }))).catch(() => {});
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheCore().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== CHUCAI_CACHE && /^chucai-/i.test(key)) return caches.delete(key);
        return Promise.resolve();
      })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML: network-first, so GitHub Pages updates appear instead of stale cache.
  if (req.mode === "navigate" || url.pathname.endsWith("/hoccungducphuc.html")) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CHUCAI_CACHE).then(cache => cache.put("./hoccungducphuc.html", copy));
        return res;
      }).catch(() => caches.match("./hoccungducphuc.html"))
    );
    return;
  }

  // Static assets: cache-first, update on miss.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CHUCAI_CACHE).then(cache => cache.put(req, copy));
        return res;
      });
    })
  );
});
