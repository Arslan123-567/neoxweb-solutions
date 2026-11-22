/**
 * NEOXWEB Service Worker — offline cache for mobile PWA
 */
const CACHE = 'neoxweb-v13';
const ASSETS = [
    './index.html',
    './manifest.json',
    './css/main.css',
    './css/home-pro.css',
    './css/home-hero-final.css',
    './css/navbar-pro.css',
    './css/responsive-shell.css',
    './js/navbar.js',
    './js/main.js',
    './js/pwa.js',
    './assets/images/neoxweb/hero-bg-new.opt.jpg',
    './assets/pwa/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) =>
            Promise.all(ASSETS.map((asset) =>
                cache.add(asset).catch((error) => {
                    console.warn('NEOXWEB: could not precache ' + asset, error);
                })
            ))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (url.pathname.includes('/backend/api/')) return;

    const sameOrigin = url.origin === self.location.origin;
    const isPage = request.mode === 'navigate'
        || request.destination === 'document'
        || /\.html?$/i.test(url.pathname)
        || url.pathname.endsWith('/');

    const isStaticAsset = sameOrigin && /\/(?:css|js|assets)\//.test(url.pathname);

    if (sameOrigin && (isPage || isStaticAsset)) {
        const cachedPromise = caches.open(CACHE)
            .then((cache) => cache.match(request))
            .catch((error) => {
                console.warn('NEOXWEB: cache lookup failed for ' + url.pathname, error);
                return null;
            });
        const updatePromise = fetch(request).then((response) => {
            if (!response.ok) return response;
            return caches.open(CACHE)
                .then((cache) => cache.put(request, response.clone()))
                .catch((error) => {
                    console.warn('NEOXWEB: could not cache ' + url.pathname, error);
                })
                .then(() => response);
        });

        event.waitUntil(updatePromise.catch((error) => {
            console.warn('NEOXWEB: background cache refresh failed for ' + url.pathname, error);
        }));
        event.respondWith(
            cachedPromise.then((cached) => {
                if (cached) return cached;
                return updatePromise.catch((error) => {
                    if (!isPage) return Promise.reject(error);
                    return caches.match('./index.html').then((fallback) => {
                        if (fallback) return fallback;
                        throw error;
                    });
                });
            })
        );
    }
});
