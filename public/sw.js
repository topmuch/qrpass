// PassHajj Manager - Service Worker v3
// Enhanced with: offline fallback, background sync, finder API caching, push support

const CACHE_NAME = 'passhajj-manager-v3';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/offline.html',
  '/sounds/beep-green.mp3',
  '/sounds/beep-blue.mp3',
  '/sounds/beep-red.mp3',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PassHajj SW v3] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PassHajj SW v3] Some assets failed to precache:', err);
        return Promise.resolve();
      });
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PassHajj SW v3] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Finder API: network-first with cache fallback (public QR lookups work offline)
  if (request.url.includes('/api/finder/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // Leader API: network-first with cache fallback (for sync)
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

  // Navigation / other requests
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else: cache-first for offline-first
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

// ─── Background Sync ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-scans') {
    console.log('[PassHajj SW v3] Background sync triggered: sync-pending-scans');
    event.waitUntil(processPendingScans());
  }
});

async function processPendingScans() {
  try {
    const db = await openIDB();
    const tx = db.transaction('pwa_data', 'readonly');
    const store = tx.objectStore('pwa_data');
    const data = await idbRequest(store.get('pending_scans'));

    await idbRequest(tx);

    const pendingScans = data && Array.isArray(data) ? data : [];

    if (pendingScans.length === 0) {
      console.log('[PassHajj SW v3] No pending scans to sync');
      db.close();
      return;
    }

    console.log('[PassHajj SW v3] Syncing', pendingScans.length, 'pending scans');

    const response = await fetch('/api/leader/sync-scans?XTransformPort=3002', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scans: pendingScans }),
    });

    if (response.ok) {
      // Success - clear pending scans from IndexedDB
      const clearTx = db.transaction('pwa_data', 'readwrite');
      const clearStore = clearTx.objectStore('pwa_data');
      await idbRequest(clearStore.delete('pending_scans'));
      await idbRequest(clearTx);
      console.log('[PassHajj SW v3] Pending scans synced and cleared');

      // Notify clients that sync completed
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          syncedCount: pendingScans.length,
        });
      });
    } else {
      console.warn('[PassHajj SW v3] Sync failed with status:', response.status);
      // Keep pending scans for next sync attempt
    }

    db.close();
  } catch (err) {
    console.error('[PassHajj SW v3] Background sync error:', err);
    // Keep pending scans for next sync attempt
  }
}

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('passhajj-manager', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pwa_data')) {
        db.createObjectStore('pwa_data');
      }
    };
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Push Notifications (placeholder) ────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[PassHajj SW v3] Push event received');

  let data = { title: 'PassHajj Manager', body: 'Vous avez une nouvelle notification' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click (placeholder) ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[PassHajj SW v3] Notification click received');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.host) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// ─── Message Handler ────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[PassHajj SW v3] SKIP_WAITING received, activating new worker');
    self.skipWaiting();
  }
});

// ─── Strategies ─────────────────────────────────────────────────────────────

/**
 * Network-first strategy: try network, fall back to cache.
 * On success, update the cache with the fresh response.
 */
async function networkFirstWithCacheFallback(request) {
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
async function cacheFirstWithNetworkFallback(request) {
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
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Navigation handler: try network first, fall back to cache, then offline page.
 * Serves /offline.html for navigation requests when fully offline.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try cache first
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Fall back to cached root page
    const cachedRoot = await caches.match('/');
    if (cachedRoot) {
      return cachedRoot;
    }
    // Last resort: serve the offline fallback page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    // Absolute fallback
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
