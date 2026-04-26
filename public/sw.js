/*
  DevNexus Service Worker
  - Currently serves as a placeholder to prevent 404 errors in the development browser.
  - Can be extended with caching logic for offline availability as the project matures.
*/

self.addEventListener('install', (_event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (_event) => {
  // Pass-through for now
  return;
});
