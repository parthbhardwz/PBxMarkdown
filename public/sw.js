self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A simple pass-through fetch handler.
  // This is required by many browsers to trigger the "Add to Home Screen" PWA prompt.
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline - Please reconnect to the internet.'))
  );
});
