const CACHE='fpro-20260409151441';
const FILES=['/meu-financeiro/','/meu-financeiro/index.html','/meu-financeiro/manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.allSettled(FILES.map(f=>c.add(f))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // HTML sempre da rede primeiro — garante versão mais recente
  if(url.pathname.endsWith('/')||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request)
        .then(r=>{ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(e.request,c)); return r; })
        .catch(()=>caches.match(e.request))
    );
    return;
  }
  // Demais assets: cache first
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/meu-financeiro/index.html')))
  );
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(cs=>{
      if(cs.length>0){cs[0].focus();return;}
      clients.openWindow('/meu-financeiro/');
    })
  );
});
