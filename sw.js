const CACHE='fpro-20260506000000';
const FILES=['/','/index.html','/manifest.json'];

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
  if(url.pathname.endsWith('/')||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request)
        .then(r=>{ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(e.request,c)); return r; })
        .catch(()=>caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/index.html')))
  );
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(cs=>{
      if(cs.length>0){cs[0].focus();return;}
      clients.openWindow('/');
    })
  );
});

// ── Periodic Background Sync ──────────────────────────────────
const IDB_NAME  = 'fpro-idb';
const IDB_STORE = 'kv';

function idbGet(key) {
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onerror = () => resolve(null);
    req.onsuccess = e => {
      const db  = e.target.result;
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const get = tx.objectStore(IDB_STORE).get(key);
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror   = () => resolve(null);
    };
  });
}

function idbSet(key, value) {
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onerror = () => resolve();
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    };
  });
}

function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

async function checarVencimentosENotificar() {
  try {
    const dados = await idbGet('fpro_v2');
    if (!dados || !Array.isArray(dados)) return;

    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];
    const alertados = (await idbGet('fpro_alerted')) || {};

    for (const item of dados) {
      if (item.pago || !item.vencimento) continue;

      const venc = new Date(item.vencimento + 'T00:00:00');
      const diff = Math.round((venc - hoje) / 86400000);

      if (diff > 3) continue;

      const chave = `${item.id}-${hojeStr}`;
      if (alertados[chave]) continue;

      let titulo, corpo;
      if (diff < 0) {
        titulo = '⚠️ Conta vencida!';
        corpo  = `${item.nome} venceu há ${Math.abs(diff)} dia(s) — ${fmt(item.valor)}`;
      } else if (diff === 0) {
        titulo = '🔴 Vence hoje!';
        corpo  = `${item.nome} — ${fmt(item.valor)}`;
      } else if (diff === 1) {
        titulo = '🟡 Vence amanhã';
        corpo  = `${item.nome} — ${fmt(item.valor)}`;
      } else {
        titulo = `🔔 Vence em ${diff} dias`;
        corpo  = `${item.nome} — ${fmt(item.valor)}`;
      }

      await self.registration.showNotification(titulo, {
        body : corpo,
        icon : '/icon-192.png',
        badge: '/icon-192.png',
        tag  : chave,
        renotify: false,
        data : { url: '/' }
      });

      alertados[chave] = true;
    }

    await idbSet('fpro_alerted', alertados);
    await idbSet('fpro_last_sw_sync', Date.now());

  } catch (e) {
    console.error('[SW PBS] Erro ao checar vencimentos:', e);
  }
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'fpro-sync') {
    e.waitUntil(checarVencimentosENotificar());
  }
});
