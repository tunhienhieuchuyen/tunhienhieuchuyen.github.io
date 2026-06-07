/* ============================================================
   Tự Nhiên Hiểu Chuyện Service Worker
   File path: /sw.js
   Scope    : /
   Purpose  : PWA cache an toàn trên GitHub Pages Gốc
   ============================================================ */

const SW_VERSION = 'tnhc-sw-v1-20260607';
const CACHE_NAME = 'tnhc-cache-v1-20260607';

/* Chỉ cache các file gốc hiện có, thêm file tĩnh của ông vào đây sau */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[TNHC SW] install', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.ok) {
              await cache.put(url, response.clone());
              console.log('[TNHC SW] cached:', url);
            }
          } catch (err) {
            console.warn('[TNHC SW] cache failed:', url, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[TNHC SW] activate', SW_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[TNHC SW] delete old cache:', key);
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

function isGetRequest(request) {
  return request && request.method === 'GET';
}

function isAppSameOrigin(requestUrl) {
  try {
    const url = new URL(requestUrl);
    return url.origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put('/index.html', fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response(
      '<!doctype html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>Đang offline</h1><p>Vui lòng kết nối mạng.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  }
}

async function handleAppAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  return cached || networkFetch || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!isGetRequest(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isAppSameOrigin(request.url)) {
    event.respondWith(handleAppAsset(request));
    return;
  }

  event.respondWith(fetch(request));
});