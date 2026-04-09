const CACHE='fpro-v3';
const FILES=['/meu-financeiro/','/meu-financeiro/index.html','/meu-financeiro/manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>{
    return Promise.allSettled(FILES.map(f=>c.add(f)));
  }).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/meu-financeiro/index.html')))
  );
});

// Notificações em background
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{
    if(cs.length>0){cs[0].focus();return;}
    clients.openWindow('/meu-financeiro/');
  }));
});

// Verificar vencimentos quando o SW acorda (a cada sync)
self.addEventListener('periodicsync',e=>{
  if(e.tag==='check-due'){
    e.waitUntil(checkDueItems());
  }
});

async function checkDueItems(){
  // Abre o banco de dados local via broadcast para a página
  const cs=await clients.matchAll({type:'window'});
  cs.forEach(c=>c.postMessage({type:'CHECK_DUE'}));
}
