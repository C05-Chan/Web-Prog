
const API_CACHE = 'api-cache';
const CACHE = 'hsww';

function interceptFetch(evt) {
  evt.respondWith(handleFetch(evt.request));
  evt.waitUntil(updateCache(evt.request));
}

async function updateCache(request) {
  if (request.method === 'POST') return;

  const c = await caches.open(CACHE);
  const response = await fetch(request);
  console.log('Updating cache ', request.url);
  return c.put(request, response);
}

async function handleFetch(request) {
  if (request.method === 'POST') return fetch(request);

  // Check cache for API request //
  if (request.url.includes('/get-results')) {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
  }


  const cache = await caches.open(CACHE);
  const cachedCopy = await cache.match(request);
  return cachedCopy || fetch(request);
}


const CACHEABLE = [
  './',
  './index.html',
  './sw.js',
  './index.js',
  './style.css',
  './runners.csv',
];

async function prepareCache() {
  const c = await caches.open(CACHE);
  await c.addAll(CACHEABLE);
  console.log('Cache prepared.');
}

self.addEventListener('install', prepareCache);
self.addEventListener('fetch', interceptFetch);
