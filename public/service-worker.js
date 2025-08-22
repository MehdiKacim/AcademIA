const CACHE_NAME = 'academia-cache-v4'; // Increment cache version
const OFFLINE_URL = '/offline.html'; // New offline page

// Assets to precache on install
const urlsToPrecache = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Note: Dynamic asset paths (like /assets/index-XXXX.js) cannot be hardcoded here.
  // They will be handled by the runtime caching strategy below.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching essential assets.');
        return cache.addAll(urlsToPrecache);
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
  // self.skipWaiting(); // Removed to allow for user-controlled update
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // .then(() => { // self.clients.claim() removed to allow for user-controlled update
    //   console.log('[Service Worker] Activation complete. Claiming clients.');
    //   return self.clients.claim();
    // })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // IMPORTANT: Bypass caching for Supabase API requests
  // The Supabase project ID is rdokwfeatumojiojzaym
  const supabaseApiUrl = 'https://rdokwfeatumojiojzaym.supabase.co/rest/v1/';
  if (event.request.url.startsWith(supabaseApiUrl)) {
    console.log('[Service Worker] Bypassing cache for Supabase API request:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategy for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network request is successful, cache and return response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache, otherwise fallback to offline page
          return caches.match(event.request)
            .then(response => response || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Strategy for other requests (CSS, JS, images, etc.) - Cache First, then Network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // If found in cache, return cached version
          return cachedResponse;
        }
        // Otherwise, fetch from network, cache, and return
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed for:', event.request.url, error);
            // You could return a fallback image or other asset here for specific types
            // For now, just re-throw or return a rejected promise
            throw error;
          });
      })
  );
});

// Listen for messages from the main window to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});