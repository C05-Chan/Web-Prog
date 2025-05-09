const CACHE_NAME = 'runpark-cache';
const API_CACHE = 'api-cache';

self.addEventListener('install', event => {
  event.waitUntil((
    async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        './',
        './index.html',
        './index.js',
        './style.css',
        './manifest.json',
        './images/placeholder_192.png',
        './images/placeholder_512.png',
        '../runners.csv',
      ]);
    })());
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (event.request.method === 'POST') {
    return;
  }

  if (request.url.includes('/get-results')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

// const API_CACHE = 'api-cache';
// const CACHE = 'hsww';

// function interceptFetch(evt) {
//   evt.respondWith(handleFetch(evt.request));
//   evt.waitUntil(updateCache(evt.request));
// }

// async function updateCache(request) {
//   if (request.method === 'POST') return;

//   const c = await caches.open(CACHE);
//   const response = await fetch(request);
//   console.log('Updating cache ', request.url);
//   return c.put(request, response);
// }

// async function handleFetch(request) {
//   if (request.method === 'POST') return fetch(request);

//   // Check cache for API request //
//   if (request.url.includes('/get-results')) {
//     const cache = await caches.open(API_CACHE);
//     const cached = await cache.match(request);
//     if (cached) return cached;
//   }


//   const cache = await caches.open(CACHE);
//   const cachedCopy = await cache.match(request);
//   return cachedCopy || fetch(request);
// }


// const CACHEABLE = [
//   './',
//   './index.html',
//   './sw.js',
//   './index.js',
//   './style.css',
//   './runners.csv',
//   './manifest.json',
//   './placeholder_192.png',
//   './placeholder_512.png',
// ];

// async function prepareCache() {
//   const c = await caches.open(CACHE);
//   await c.addAll(CACHEABLE);
//   console.log('Cache prepared.');
// }

// self.addEventListener('install', event => {
//   event.waitUntil(prepareCache());
// });

// self.addEventListener('fetch', interceptFetch);
