// A very basic service worker to make the app installable.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // An empty install handler is sufficient to make the app installable.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // A minimal fetch handler is required for the app to be installable.
  // This basic handler simply passes the request through to the network.
  event.respondWith(fetch(event.request));
});
