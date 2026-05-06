/*
  DevNexus Service Worker
  - Handles background tasks and displays native desktop push-like notifications.
  - Caches critical static assets for ultra-fast load times and offline availability.
  - Keeps the app engaging and alive even when minimized or in the background.
*/

const CACHE_NAME = "devnexus-static-v1";
const STATIC_ASSETS = [
  "/favicon.ico",
  "/manifest.json"
];

// 1. Install Event: Cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Cache-First strategy for static assets, Network-First fallback for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API routes, chrome extensions, or non-GET requests
  if (request.method !== "GET" || url.pathname.startsWith("/api") || !url.protocol.startsWith("http")) {
    return;
  }

  // Caching strategy: Cache-First for static assets (fonts, icons, styles), Network-First for others
  const isStaticAsset = 
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|css|js)$/) ||
    STATIC_ASSETS.includes(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Dynamically cache newly fetched static assets
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          // Silent catch for network failure
        });
      })
    );
  }
});

// 4. Message Event: Handle real-time push-like notifications with Interactive Actions
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url, token, issueId, severity } = event.data.payload;
    
    // Require interaction (keep on screen) for high priority or critical incidents
    const isUrgent = severity === 'CRITICAL' || severity === 'HIGH' || severity === 'Critical' || severity === 'High';
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: issueId ? `issue-${issueId}` : (tag || 'devnexus-notification'),
        vibrate: isUrgent ? [300, 100, 300, 100, 300] : [100, 50, 100],
        badge: '/favicon.ico',
        requireInteraction: isUrgent,
        data: { url, token, issueId },
        actions: issueId && token ? [
          { action: 'view', title: '🎯 View Incident' },
          { action: 'resolve', title: '✅ Resolve' },
          { action: 'close', title: 'Dismiss' }
        ] : [
          { action: 'view', title: '🎯 View' },
          { action: 'close', title: 'Dismiss' }
        ]
      })
    );
  }
});

// 5. Notification Click Event: Handle action clicks (navigate or close or background resolve)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url: targetUrl, token, issueId } = event.notification.data || {};

  if (event.action === 'close') {
    return; // User clicked "Dismiss" action button
  }

  // Handle direct background resolution from native desktop action buttons!
  if (event.action === 'resolve' && issueId && token) {
    event.waitUntil(
      fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      }).then((res) => {
        if (res.ok) {
          // Show confirmation notification on successful background resolution
          return self.registration.showNotification("✅ Incident Resolved", {
            body: "Incident has been marked as resolved directly from your desktop.",
            icon: '/favicon.ico',
            tag: `resolve-success-${issueId}`
          });
        }
      }).catch((err) => {
        console.error("Background resolve fetch error:", err);
      })
    );
    return;
  }

  if (targetUrl) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // If not open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});
