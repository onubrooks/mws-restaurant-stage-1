var staticCacheName = 'mws-rest-stage1-v1';
var urlsToCache = [
  "/",
  "/css/*",
  "/js/*",
  "/img/*",
];
var allCaches = [
  staticCacheName
];

self.addEventListener('install', (event) => {
  event.waitUntil( 
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  // delete all caches whose name starts with given prefix and are not in the allCaches array
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('mws-rest-stage1') && !allCaches.includes(cacheName);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});