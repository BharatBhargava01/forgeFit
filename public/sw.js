const CACHE_NAME = 'forgefit-v5';
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

// Activate Event - Clean up old caches & notify clients of updates
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all([
        ...keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }),
        // Broadcast to all PWA clients to force refresh
        self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'VERSION_UPDATE', version: CACHE_NAME });
          });
        })
      ]);
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve cached assets or fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip caching API requests entirely, let storage.js handle offline fallbacks
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 1. Network-First for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Stale-While-Revalidate for static assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            // Cache Google Fonts or local Next.js basic static chunks
            const isFont = url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com');
            const isLocalStatic = networkResponse.type === 'basic' && (url.pathname.includes('/_next/') || url.pathname.includes('/static/') || STATIC_ASSETS.includes(url.pathname));

            if (isFont || isLocalStatic) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // Fail silently for background updates
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle notification clicks (especially on mobile PWAs)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window client if open
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window at the root
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Periodic background sync logic for motivation checks
self.addEventListener('periodicsync', event => {
  if (event.tag === 'motivation-check') {
    event.waitUntil(checkMotivationInServiceWorker());
  }
});

async function checkMotivationInServiceWorker() {
  try {
    const cache = await caches.open('forgefit-settings-cache');
    const response = await cache.match('/offline-settings.json');
    if (!response) return;

    const settings = await response.json();
    if (!settings.enabled) return;

    const todayStr = new Date().toDateString();
    const currentHour = new Date().getHours();

    // Check if we should notify at this hour
    const hours = settings.hours || [8, 12, 15, 18, 21];
    if (!hours.includes(currentHour)) return;

    // Check if we already notified for this hour today in the SW cache
    const lastKeyResponse = await cache.match('/last-notification-hour.json');
    const currentKey = `${todayStr}:${currentHour}`;
    if (lastKeyResponse) {
      const lastKeyData = await lastKeyResponse.json();
      if (lastKeyData.key === currentKey) return;
    }

    // Pick a random quote
    const quotes = [
      "No pain, no gain. Shut up and train! ⚡",
      "The only bad workout is the one that didn't happen. 🏋️‍♂️",
      "Your body can stand almost anything. Convince your mind! 🧠",
      "Success isn't always about greatness. It's about consistency. 🎯",
      "Dream extreme. Train insane. Obtain the gain. 💪",
      "You don't have to be extreme, just consistent. 🔥",
      "Action is the foundational key to all success. 🚀",
      "Energy flows where attention goes. Focus on your strength! 🌟",
      "Don't limit your challenges. Challenge your limits. 🏔️",
      "Strength comes from an indomitable will! 🦁",
      "What hurts today makes you stronger tomorrow. 🌅",
      "Remember why you started. Push harder today! ⚡",
      "Your future self will thank you for the work you put in today. 🏆"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Trigger local push notification
    await self.registration.showNotification("ForgeFit Motivation ⚡", {
      body: randomQuote,
      icon: '/icon-192.png'
    });

    // Save the notification hour key to cache to prevent duplicates
    await cache.put(
      new Request('/last-notification-hour.json'),
      new Response(JSON.stringify({ key: currentKey }))
    );
  } catch (e) {
    console.error('[SW Motivation Check] Error:', e);
  }
}
