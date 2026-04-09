// Cache name usa timestamp passado via query string no registro
// Ex: sw.js?v=20260409102321 → CACHE = 'fpro-20260409102321'
const urlParams=new URL(location.href).searchParams;
const VERSION=urlParams.get('v')||'fpro-static';
const CACHE='fpro-'+VERSION;
const FILES=['/meu-financeiro/','/meu-financeiro/index.html','/meu-financeiro/manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>Promise.allSettled(FILES.map(f=>c.add(f))))
    .then(()=>self.skipWaiting()) // ativa imediatamente sem esperar fechar
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    // Apaga TODOS os caches antigos que não sejam o atual
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>{
        console.log('[SW] Deletando cache antigo:',k);
        return caches.delete(k);
      })))
      .then(()=>clients.claim()) // assume controle imediato de todas as abas
  );
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request)
      .then(r=>r||fetch(e.request).catch(()=>caches.match('/meu-financeiro/index.html')))
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

self.addEventListener('periodicsync',e=>{
  if(e.tag==='check-due'){
    e.waitUntil(
      clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>c.postMessage({type:'CHECK_DUE'})))
    );
  }
});
