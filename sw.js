/* LifeOS GitHub Web Pure Restore Core Service Worker */
const SW_VERSION = 'tnhc-sw-web-pure-restore-core-20260628-r1';
const CACHE_NAME = 'tnhc-cache-web-pure-restore-core-20260628-r1';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(CORE_ASSETS.map(async url => {
    try { const res = await fetch(url, {cache:'reload'}); if(res && res.ok) await cache.put(url, res.clone()); } catch(e) {}
  }))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE_NAME?null:caches.delete(k)))).then(()=>self.clients.claim()));
});
function sameOrigin(u){try{return new URL(u).origin === self.location.origin;}catch(e){return false;}}
async function nav(request){
  try { const fresh = await fetch(request); const cache = await caches.open(CACHE_NAME); cache.put('/index.html', fresh.clone()).catch(()=>{}); return fresh; }
  catch(e){ const cached = await caches.match('/index.html'); if(cached) return cached; return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><h1>Đang offline</h1>',{headers:{'Content-Type':'text/html; charset=utf-8'}}); }
}
async function asset(request){
  const cache = await caches.open(CACHE_NAME); const cached = await cache.match(request);
  const net = fetch(request).then(res => { if(res && res.ok) cache.put(request, res.clone()).catch(()=>{}); return res; }).catch(()=>null);
  return cached || net || fetch(request);
}
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(req.method === 'POST' && url.pathname === '/index.html' && url.searchParams.get('lifeos_share_target') === '1') {
    event.respondWith(Response.redirect('/index.html?lifeos_share_target=1&lifeos_share_pending=1', 303));
    return;
  }
  if(req.method !== 'GET') return;
  if(req.mode === 'navigate') { event.respondWith(nav(req)); return; }
  if(sameOrigin(req.url)) { event.respondWith(asset(req)); return; }
});
