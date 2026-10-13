// Offline cache: the whole game runs locally, so cache the shell and modules on first load.
const CACHE = 'wwe-legacy-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok && (new URL(req.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(req.url))) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req) || await cache.match('index.html');
      if (hit) return hit;
      throw err;
    }
  })());
});
