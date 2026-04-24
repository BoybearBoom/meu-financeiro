const CACHE='fpro-20260424000000';
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
  if(url.pathname.endsWith('/')||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request)
        .then(r=>{ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(e.request,c)); return r; })
        .catch(()=>caches.match(e.request))
    );
    return;
  }
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

// ── IDB helpers ──
const IDB_NAME='fpro-idb';
const IDB_STORE='kv';

function idbGet(key){
  return new Promise((resolve)=>{
    const req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=e=>e.target.result.createObjectStore(IDB_STORE);
    req.onerror=()=>resolve(null);
    req.onsuccess=e=>{
      const db=e.target.result;
      const tx=db.transaction(IDB_STORE,'readonly');
      const get=tx.objectStore(IDB_STORE).get(key);
      get.onsuccess=()=>resolve(get.result??null);
      get.onerror=()=>resolve(null);
    };
  });
}

function idbSet(key,value){
  return new Promise((resolve)=>{
    const req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=e=>e.target.result.createObjectStore(IDB_STORE);
    req.onerror=()=>resolve();
    req.onsuccess=e=>{
      const db=e.target.result;
      const tx=db.transaction(IDB_STORE,'readwrite');
      tx.objectStore(IDB_STORE).put(value,key);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>resolve();
    };
  });
}

function fmt(v){
  return'R$ '+parseFloat(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}

// ── Checa vencimentos de despesas ──
async function checarVencimentos(dados, alertados, hojeStr, hoje){
  const novosAlertados={};
  for(const item of dados){
    if(item.pago||!item.vencimento)continue;
    const venc=new Date(item.vencimento+'T00:00:00');
    const diff=Math.round((venc-hoje)/86400000);
    if(diff>3)continue;
    const chave=`${item.id}-${hojeStr}`;
    if(alertados[chave])continue;

    let titulo,corpo;
    if(diff<0){titulo='⚠️ Conta vencida!';corpo=`${item.nome} venceu há ${Math.abs(diff)} dia(s) — ${fmt(item.valor)}`;}
    else if(diff===0){titulo='🔴 Vence hoje!';corpo=`${item.nome} — ${fmt(item.valor)}`;}
    else if(diff===1){titulo='🟡 Vence amanhã';corpo=`${item.nome} — ${fmt(item.valor)}`;}
    else{titulo=`🔔 Vence em ${diff} dias`;corpo=`${item.nome} — ${fmt(item.valor)}`;}

    await self.registration.showNotification(titulo,{
      body:corpo,icon:'/meu-financeiro/icon-192.png',badge:'/meu-financeiro/icon-192.png',
      tag:chave,renotify:false,data:{url:'/meu-financeiro/'},
      vibrate:[200,100,200]
    });
    novosAlertados[chave]=true;
  }
  return novosAlertados;
}

// ── Checa fechamento de cartões ──
async function checarCartoes(cartoes, alertados, hojeStr, hoje){
  const novosAlertados={};
  const diasAviso=3;
  for(const c of cartoes){
    if(!c.fechamento)continue;
    let fechDay=c.fechamento;
    let fechDate=new Date(hoje.getFullYear(),hoje.getMonth(),fechDay);
    if(fechDate<hoje)fechDate=new Date(hoje.getFullYear(),hoje.getMonth()+1,fechDay);
    const diff=Math.round((fechDate-hoje)/86400000);
    if(diff>diasAviso||diff<0)continue;
    const chave=`fatura-${c.nome}-${fechDate.toISOString().split('T')[0]}`;
    if(alertados[chave])continue;

    let msg;
    if(diff===0)msg=`🔴 Fatura do ${c.icone||'💳'} ${c.nome} FECHA HOJE!`;
    else if(diff===1)msg=`🟡 Fatura do ${c.icone||'💳'} ${c.nome} fecha amanhã.`;
    else msg=`🔔 Fatura do ${c.icone||'💳'} ${c.nome} fecha em ${diff} dias (dia ${fechDay}).`;

    await self.registration.showNotification('FinancesPro — Cartão',{
      body:msg,icon:'/meu-financeiro/icon-192.png',badge:'/meu-financeiro/icon-192.png',
      tag:chave,renotify:false,data:{url:'/meu-financeiro/'},
      vibrate:[100,50,100]
    });
    novosAlertados[chave]=true;
  }
  return novosAlertados;
}

// ── Tarefa principal do background sync ──
async function checarVencimentosENotificar(){
  try{
    const dados=await idbGet('fpro_v2');
    const cartoes=await idbGet('fpro_cartoes');
    if((!dados||!Array.isArray(dados))&&(!cartoes||!Array.isArray(cartoes)))return;

    const hoje=new Date();hoje.setHours(0,0,0,0);
    const hojeStr=hoje.toISOString().split('T')[0];
    let alertados=(await idbGet('fpro_alerted'))||{};

    // Checa despesas
    if(dados&&Array.isArray(dados)){
      const novos=await checarVencimentos(dados,alertados,hojeStr,hoje);
      alertados={...alertados,...novos};
    }

    // Checa cartões
    if(cartoes&&Array.isArray(cartoes)){
      const novos=await checarCartoes(cartoes,alertados,hojeStr,hoje);
      alertados={...alertados,...novos};
    }

    await idbSet('fpro_alerted',alertados);
    await idbSet('fpro_last_sw_sync',Date.now());

  }catch(e){
    console.error('[SW PBS] Erro:',e);
  }
}

// ── Periodic Background Sync (Chrome Android — funciona com app fechado) ──
self.addEventListener('periodicsync',e=>{
  if(e.tag==='fpro-sync'){
    e.waitUntil(checarVencimentosENotificar());
  }
});

// ── Mensagens do app (agendamento manual) ──
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SCHEDULE_NOTIFS'){
    // Dados chegam via postMessage quando app está aberto
    // Salva no IDB para uso futuro em background
    if(e.data.items)idbSet('fpro_v2',e.data.items);
    if(e.data.cartoes)idbSet('fpro_cartoes',e.data.cartoes);
  }
  if(e.data&&e.data.type==='CANCEL_NOTIFS'){
    self.registration.getNotifications().then(ns=>ns.forEach(n=>n.close()));
  }
  if(e.data&&e.data.type==='RUN_NOW'){
    checarVencimentosENotificar();
  }
});
