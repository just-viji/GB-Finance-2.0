
const CACHE_NAME = 'gb-finance-cache-v7';
// Only cache essential, same-origin app shell files during installation.
// Icons have been removed as they are now embedded data URIs.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install the service worker and cache the app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        // Adding error logging for easier debugging of installation failures.
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Serve cached content when offline.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests and ignore potential API calls.
  const isApiCall = event.request.url.includes('generativelanguage.googleapis.com');
  if (event.request.method !== 'GET' || isApiCall) {
    // Let the browser handle it as usual.
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, cache it, and return response
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed, returning offline fallback. Error:', error);
            // If fetch fails (e.g., offline) and it's a navigation request,
            // serve the main app page from cache.
            if (event.request.mode === 'navigate') {
                return caches.match('/');
            }
            // For other failed requests (assets), the browser error is probably appropriate.
        });
      })
  );
});

// Update a service worker and remove old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
