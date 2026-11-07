const CACHE = 'mi-despensa-v3';
const ASSETS = [
  './', './index.html', './style.css', './data.js', './app.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './Guia_despensa_30_dias_noviembre_2026.pdf'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(found => found || caches.match('./index.html'))));
  } else {
    event.respondWith(caches.match(req).then(found => found || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
      return res;
    })));
  }
});
