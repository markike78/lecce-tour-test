// Offline cache for the Lecce tour test app. Bump VERSION when files change.
const VERSION = 'lecce-test-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from the cache first so the app opens with no signal; refresh the cache in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const refresh = fetch(e.request).then(res => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(refresh); return hit; }
      const res = await refresh;
      return res || (await cache.match('./index.html')) || Response.error();
    })
  );
});
