// Service worker: cache-first app shell + data so the game works fully offline once loaded. Bump VERSION on every release.
const VERSION = 'ma-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/main.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/countries.csv',
  'data/resources.csv',
  'data/cities.csv',
  'data/map.json',
  'data/econ_profiles.json',
  'data/orgs.json',
  'data/geopolitics.json',
  'data/chokepoints.json',
  'data/policies.json',
  'data/scenarios.json',
  'data/techs.psv',
  'data/events.json',
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            if (res.ok && new URL(e.request.url).origin === location.origin) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => caches.match('index.html')),
    ),
  );
});
