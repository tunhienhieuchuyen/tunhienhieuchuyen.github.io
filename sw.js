/* ============================================================
   Tự Nhiên Hiểu Chuyện Service Worker
   File path: /sw.js
   Scope    : /
   Purpose  : PWA cache an toàn trên GitHub Pages
              + Web Repair Clean PWA Share Target POST -> IndexedDB
   ============================================================ */

'use strict';

const SW_VERSION = 'tnhc-sw-v3-20260628-web-repair-clean';
const CACHE_NAME = 'tnhc-cache-v3-20260628-web-repair-clean';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json', '/sw.js'];

const LIFEOS_SHARE_DB = 'lifeos_pwa_share_v1';
const LIFEOS_SHARE_STORE = 'shares';
const LIFEOS_SHARE_KEY = 'latest';
const LIFEOS_SHARE_ROUTE_PARAM = 'lifeos_share_target';
const LIFEOS_SHARE_RECEIVED_URL = '/index.html?lifeos_share_target_received=1';

self.addEventListener('install', (event) => {
  console.log('[TNHC SW] install', SW_VERSION);
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response && response.ok) await cache.put(url, response.clone());
      } catch (err) { console.warn('[TNHC SW] cache failed:', url, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  console.log('[TNHC SW] activate', SW_VERSION);
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
    await self.clients.claim();
  })());
});

function isGetRequest(request) { return request && request.method === 'GET'; }
function sameOrigin(requestUrl) { try { return new URL(requestUrl).origin === self.location.origin; } catch (e) { return false; } }
function isShareTargetPost(request) {
  try {
    if (!request || request.method !== 'POST') return false;
    const url = new URL(request.url);
    return url.origin === self.location.origin && url.searchParams.get(LIFEOS_SHARE_ROUTE_PARAM) === '1';
  } catch (e) { return false; }
}
function openShareDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LIFEOS_SHARE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIFEOS_SHARE_STORE)) db.createObjectStore(LIFEOS_SHARE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB_open_failed'));
  });
}
async function putLatestShare(payload) {
  const db = await openShareDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LIFEOS_SHARE_STORE, 'readwrite');
    tx.objectStore(LIFEOS_SHARE_STORE).put(payload, LIFEOS_SHARE_KEY);
    tx.oncomplete = () => { try { db.close(); } catch (e) {} resolve(true); };
    tx.onerror = () => { try { db.close(); } catch (e) {} reject(tx.error || new Error('indexedDB_put_failed')); };
  });
}
function isFormFile(value) { return value && typeof value.name === 'string' && typeof value.size === 'number' && typeof value.arrayBuffer === 'function'; }
async function handleShareTargetPost(request) {
  const createdAt = new Date().toISOString();
  try {
    const form = await request.formData();
    const files = [];
    for (const key of ['files', 'file', 'media']) {
      const values = form.getAll(key) || [];
      for (const value of values) if (isFormFile(value)) files.push(value);
    }
    await putLatestShare({
      source: 'pwa_share_target', swVersion: SW_VERSION, createdAt,
      title: String(form.get('title') || ''), text: String(form.get('text') || ''), url: String(form.get('url') || ''), files
    });
    console.log('[TNHC SW] share stored', { files: files.length });
  } catch (err) {
    console.warn('[TNHC SW] share failed', err);
    try { await putLatestShare({ source: 'pwa_share_target', swVersion: SW_VERSION, createdAt, error: String(err && err.message || err), files: [] }); } catch (e) {}
  }
  return Response.redirect(new URL(LIFEOS_SHARE_RECEIVED_URL, self.location.origin).href, 303);
}
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/index.html', fresh.clone()).catch(() => {});
      return fresh;
    }
    throw new Error('navigation_http_' + (fresh && fresh.status));
  } catch (err) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response('<!doctype html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>Đang offline</h1><p>Vui lòng kết nối mạng.</p></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 });
  }
}
async function handleAppAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request, { cache: 'no-store' }).then((response) => {
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => null);
  return cached || network || fetch(request);
}
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (isShareTargetPost(request)) { event.respondWith(handleShareTargetPost(request)); return; }
  if (!isGetRequest(request)) return;
  if (request.mode === 'navigate') { event.respondWith(handleNavigation(request)); return; }
  if (sameOrigin(request.url)) { event.respondWith(handleAppAsset(request)); return; }
  event.respondWith(fetch(request));
});
