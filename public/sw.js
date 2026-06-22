const CACHE_NAME = 'forgefit-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Pre-cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching Next.js static assets');
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
  // Only handle GET requests to avoid caching POST/PUT/DELETE API or analytics payloads
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Ignore non-http/https requests (e.g., chrome-extension://, about:blank, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

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
        // Cache dynamic Google Fonts requests
        if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        // Cache local Next.js JS/CSS chunks that are successful
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        return networkResponse;
      }).catch(() => {
        // If offline and requesting navigation, fallback to root page '/'
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
