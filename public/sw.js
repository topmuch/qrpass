/// <reference lib="webworker" />

const CACHE_NAME = 'passhajj-manager-v2';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/sounds/beep-green.mp3',
  '/sounds/beep-blue.mp3',
  '/sounds/beep-red.mp3',
];

// Install event - pre-cache essential assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PassHajj SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PassHajj SW] Some assets failed to precache:', err);
        // Still install even if some assets fail
        return Promise.resolve();
      });
    })
  );
  // Activate immediately without waiting
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PassHajj SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// Fetch event - offline-first routing
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls: network-first with cache fallback (for sync)
  if (request.url.includes('/api/leader/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // Other API calls: network-only
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Sound files: cache-first (must work offline)
  const isSoundRequest = request.url.includes('/sounds/');

  // Static images / icons / items: cache-first
  const isImageRequest =
    request.url.includes('/images/') ||
    request.url.includes('/items/') ||
    request.url.includes('/icons/');

  if (isSoundRequest || isImageRequest) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }

  // Navigation / other requests: cache-first for offline-first
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

/**
 * Network-first strategy: try network, fall back to cache.
 * On success, update the cache with the fresh response.
 */
async function networkFirstWithCacheFallback(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Cache-first strategy: try cache, fall back to network.
 * On network success, populate the cache for future use.
 */
async function cacheFirstWithNetworkFallback(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // For navigation requests, return the cached root page
    if (request.mode === 'navigate') {
      const cachedRoot = await caches.match('/');
      if (cachedRoot) return cachedRoot;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Type declarations for service worker
declare const self: ServiceWorkerGlobalScope;

interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<unknown>): void;
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response | undefined> | Response | undefined): void;
}
