const CACHE = 'fpro-v2-clean';

const FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png'
];

// INSTALAÇÃO
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
  );
});

// ATIVAÇÃO
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH (SEM QUEBRAR FIREBASE)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => res)
      .catch(() => caches.match(e.request))
  );
});

// NOTIF CLICK
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      if (clientsArr.length > 0) {
        clientsArr[0].focus();
        return;
      }
      clients.openWindow('/');
    })
  );
});
