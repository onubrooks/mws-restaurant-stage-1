var staticCacheName = 'curr-conv-static-v1';
var urlsToCache = [
  "/",
  "/dist/css/foundation.min.css",
  "/dist/css/app.css",
  "/dist/js/app.js",
  "/dist/js/idb.js",
  "/dist/img/loader.gif",
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
          return cacheName.startsWith('curr-conv-static') && !allCaches.includes(cacheName);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // the commented section of code below can be used to load a skeleton of the app but 
  // wont be necessary since the site is fairly light and most of the content is static
  // var requestUrl = new URL(event.request.url);

  // if (requestUrl.origin === location.origin) {
  //   if (requestUrl.pathname === '/') {
  //     event.respondWith(caches.match('/skeleton'));
  //     return;
  //   }
  // }

  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  console.log('Testing Push Message...');
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});