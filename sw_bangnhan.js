/* Bé Học Bảng Nhân - PWA Service Worker - PHA 13.1 refresh cache
   Upload this file as repo root /sw_bangnhan.js
*/
const BANGNHAN_CACHE = "bangnhan-p13-1-20260611-01";

const CORE_ASSETS = [
  "./",
  "./hocbangnhan.html",
  "./manifest_bangnhan.json",
  "./icon-192.png",
  "./icon-512.png",
  "./voicebank_bangnhan/voice_manifest.json"
];

async function cacheCoreAndVoiceBank() {
  const cache = await caches.open(BANGNHAN_CACHE);
  await cache.addAll(CORE_ASSETS.map(u => new Request(u, { cache: "reload" }))).catch(() => {});

  try {
    const res = await fetch("./voicebank_bangnhan/voice_manifest.json", { cache: "reload" });
    if (!res.ok) return;
    const manifest = await res.clone().json();
    await cache.put("./voicebank_bangnhan/voice_manifest.json", res);
    const files = Object.values(manifest.map || {});
    for (const f of files) {
      try { await cache.add(new Request(f, { cache: "reload" })); } catch(e) {}
    }
  } catch(e) {}
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheCoreAndVoiceBank().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== BANGNHAN_CACHE && /^bangnhan-/i.test(key)) return caches.delete(key);
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

  // HTML must be network-first so GitHub updates appear instead of stale cache.
  if (req.mode === "navigate" || url.pathname.endsWith("/hocbangnhan.html")) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(BANGNHAN_CACHE).then(cache => cache.put("./hocbangnhan.html", copy));
        return res;
      }).catch(() => caches.match("./hocbangnhan.html"))
    );
    return;
  }

  // Static assets: cache-first, update on miss.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(BANGNHAN_CACHE).then(cache => cache.put(req, copy));
        return res;
      });
    })
  );
});
