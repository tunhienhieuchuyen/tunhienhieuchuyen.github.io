/* Bé Học Bảng Nhân - PWA Service Worker - VOICEBANK + MUSIC TOGGLE
   Upload under repo root /bangnhan/sw_bangnhan.js
   App file: /bangnhan/hocbangnhan.html
   Voicebank folder remains at repo root: /voicebank_bangnhan/
*/
const BANGNHAN_CACHE = "bangnhan-voicebank-music-toggle-20260612-01";

const CORE_ASSETS = [
  "./",
  "./hocbangnhan.html",
  "./manifest_bangnhan.json",
  "./icon-bangnhan-192.png",
  "./icon-bangnhan-512.png",
  "../voicebank_bangnhan/voice_manifest.json"
];

function normalizeVoicePath(p) {
  return String(p || "")
    .replace(/^\.\/voicebank_bangnhan\//, "../voicebank_bangnhan/")
    .replace(/^\/voicebank_bangnhan\//, "../voicebank_bangnhan/");
}

async function cacheCoreAndVoiceBank() {
  const cache = await caches.open(BANGNHAN_CACHE);
  await cache.addAll(CORE_ASSETS.map(u => new Request(u, { cache: "reload" }))).catch(() => {});

  try {
    const res = await fetch("../voicebank_bangnhan/voice_manifest.json", { cache: "reload" });
    if (!res.ok) return;
    const manifest = await res.clone().json();
    await cache.put("../voicebank_bangnhan/voice_manifest.json", res);
    const files = Object.values(manifest.map || {});
    for (const f of files) {
      const normalized = normalizeVoicePath(f);
      if (!normalized) continue;
      try { await cache.add(new Request(normalized, { cache: "reload" })); } catch(e) {}
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

  const inApp = url.pathname.includes("/bangnhan/");
  const inVoiceBank = url.pathname.includes("/voicebank_bangnhan/");
  if (!inApp && !inVoiceBank) return;

  // HTML: network-first so GitHub updates appear instead of stale cache.
  if (req.mode === "navigate" || url.pathname.endsWith("/bangnhan/hocbangnhan.html")) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(BANGNHAN_CACHE).then(cache => cache.put("./hocbangnhan.html", copy));
        return res;
      }).catch(() => caches.match("./hocbangnhan.html"))
    );
    return;
  }

  // Voicebank/static assets: cache-first, update on miss.
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
