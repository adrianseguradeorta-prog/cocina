/* Mi despensa · v2026.11.07.2
 * La instalación de versiones nuevas no interrumpe la sesión actual.
 * La app activa la versión instalada cuando el usuario acepta el aviso.
 */
const CACHE='mi-despensa-v2026.11.07.2';
const PRECACHE=[
  './','./index.html','./style.css','./data.js','./logic.js','./app.js',
  './manifest.webmanifest','./icon-192.png','./icon-512.png',
  './Guia_despensa_30_dias_noviembre_2026.pdf'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));
});
self.addEventListener('message',event=>{
  if(event.data && event.data.type==='ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(name=>name.startsWith('mi-despensa-') && name!==CACHE)
        .map(name=>caches.delete(name))
    )).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // Nunca dar un manifiesto de versión desactualizado.
  if(url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(req,{cache:'no-store'}));return;
  }
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){
        const copy=res.clone();
        event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',copy)));
      }
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    if(res.ok){
      const copy=res.clone();
      event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)));
    }
    return res;
  })));
});
