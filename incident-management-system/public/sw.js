const CACHE_NAME = "devnexus-static-v2";
const STATIC_ASSETS = ["/favicon.ico", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) =>
            name === CACHE_NAME ? Promise.resolve() : caches.delete(name)
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    !url.protocol.startsWith("http")
  ) {
    return;
  }

  const isStaticAsset =
    /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|css|js)$/.test(url.pathname) ||
    STATIC_ASSETS.includes(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SHOW_NOTIFICATION") return;

  const { title, body, icon, tag, url, issueId, severity } =
    event.data.payload;
  const isUrgent = ["CRITICAL", "HIGH", "Critical", "High"].includes(severity);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/favicon.ico",
      tag: issueId ? `issue-${issueId}` : tag || "devnexus-notification",
      vibrate: isUrgent ? [300, 100, 300, 100, 300] : [100, 50, 100],
      badge: "/favicon.ico",
      requireInteraction: isUrgent,
      data: { url },
      actions: [
        { action: "view", title: "View" },
        { action: "close", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const { url: targetUrl } = event.notification.data || {};
  if (!targetUrl) return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow
          ? self.clients.openWindow(targetUrl)
          : undefined;
      })
  );
});
