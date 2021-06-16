let cacheName = 'core';
let filesToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/scriptjs',
  '/smb_kick.waw',
  '/smb_jump-small.waw',
  '/smb_bump.waw'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
