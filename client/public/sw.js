// FitJourney Service Worker - PWA Support
const CACHE_NAME = 'fitjourney-v1';
const STATIC_CACHE_NAME = 'fitjourney-static-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/pwa-icon-192.svg',
  '/pwa-icon-512.svg',
  '/pwa-icon-apple-touch.svg'
];

// API routes to cache
const API_CACHE_PATTERNS = [
  '/api/user',
  '/api/photos',
  '/api/activities',
  '/api/metrics'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => url !== '/'));
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
      // HTML files - Network first, cache fallback
      event.respondWith(networkFirstStrategy(request));
    } else if (url.pathname.startsWith('/api/')) {
      // API requests - Network first with cache fallback
      event.respondWith(apiCacheStrategy(request));
    } else if (url.pathname.startsWith('/static/') || url.pathname.includes('.')) {
      // Static assets - Cache first
      event.respondWith(cacheFirstStrategy(request));
    } else {
      // Other requests - Network first
      event.respondWith(networkFirstStrategy(request));
    }
  }
});

// Network First Strategy (good for HTML and API)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>FitJourney - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <h1>🏋️ FitJourney</h1>
          <div class="offline">
            <h2>You're offline</h2>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    throw error;
  }
}

// Cache First Strategy (good for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// API Cache Strategy (network first with intelligent caching)
async function apiCacheStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Only cache GET requests for user data
      const url = new URL(request.url);
      const shouldCache = API_CACHE_PATTERNS.some(pattern => 
        url.pathname.startsWith(pattern)
      );
      
      if (shouldCache) {
        const cache = await caches.open(CACHE_NAME);
        // Cache for 5 minutes for API responses
        const responseToCache = networkResponse.clone();
        responseToCache.headers.set('sw-cache-timestamp', Date.now().toString());
        cache.put(request, responseToCache);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API request failed, checking cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still fresh (5 minutes)
      const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const isStale = timestamp && (Date.now() - parseInt(timestamp)) > 5 * 60 * 1000;
      
      if (!isStale) {
        console.log('Service Worker: Returning cached API response');
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Here you could implement background sync for offline actions
  }
});

// Push notification support (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-icon-192.svg',
      badge: '/pwa-icon-192.svg',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FitJourney', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('Service Worker: Loaded successfully');