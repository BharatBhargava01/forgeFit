const CACHE_NAME = 'forgefit-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/pages.css',
  '/css/analytics.css',
  '/js/app.js',
  '/js/data.js',
  '/js/generator.js',
  '/js/routine.js',
  '/js/storage.js',
  '/js/ui.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Pre-cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve cached assets or fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip caching API requests entirely, let storage.js handle offline fallbacks
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        // Cache dynamic Google Fonts requests or valid basic requests
        if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        // Cache local requests that are successful
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        return networkResponse;
      }).catch(() => {
        // If offline and requesting navigation, fallback to index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
