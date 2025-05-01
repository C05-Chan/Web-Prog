
function interceptFetch(evt) {
    evt.respondWith(handleFetch(evt.request));
    evt.waitUntil(updateCache(evt.request));
}

async function handleFetch(request) {
    if (request.method === 'POST') {
        return fetch(request);
    }

    const c = await caches.open(CACHE);
    const cachedCopy = await c.match(request);
    return cachedCopy || Promise.reject(new Error('no-match'));
}

async function updateCache(request) {
    if (request.method === 'POST') return;

    const c = await caches.open(CACHE);
    const response = await fetch(request);
    console.log('Updating cache ', request.url);
    return c.put(request, response);
}

const CACHE = 'hsww';

const CACHEABLE = [
    './',
    './index.html',
    './sw.js',
    './index.js',
    './style.css',
    './runnerData.csv',
];

async function prepareCache() {
    const c = await caches.open(CACHE);
    await c.addAll(CACHEABLE);
    console.log('Cache prepared.');
}

self.addEventListener('install', prepareCache);
self.addEventListener('fetch', interceptFetch);
