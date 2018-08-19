let staticCacheName = 'mws-rest-stage1-v1';
let urlsToCache = [
  "/",
  "/restaurant.html?id=1",
  "/css/styles.css",
  "/js/main.js",
  "/js/restaurant_info.js",
  "/js/dbhelper.js",
  "/img/1.jpg",
  "/img/1-400.jpg",
  "/img/2.jpg",
  "/img/2-400.jpg",
  "/img/3.jpg",
  "/img/3-400.jpg",
  "/img/4.jpg",
  "/img/4-400.jpg",
  "/img/5.jpg",
  "/img/5-400.jpg",
  "/img/6.jpg",
  "/img/6-400.jpg",
  "/img/7.jpg",
  "/img/7-400.jpg",
  "/img/8.jpg",
  "/img/8-400.jpg",
  "/img/9.jpg",
  "/img/9-400.jpg",
  "/img/10.jpg",
  "/img/10-400.jpg",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
  "http://localhost:8000/data/restaurants.json"
]; 
let allCaches = [
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