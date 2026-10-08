/* Dachplaner PV – Service Worker (Version 2026.10.08.1)
   Programmseite: erst Netz (höchstens 4 s), sonst die gespeicherte Kopie → läuft offline, ist online immer aktuell.
   Symbole/Schriften: aus dem Zwischenspeicher. GitHub-API (Projektabgleich) und update.json gehen nie über den Cache. */
const CACHE="dachplaner-2026.10.08.1";
const CORE=["./","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("dachplaner-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url);
  const same=url.origin===self.location.origin, font=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!same&&!font) return;
  const page=same&&/\/(index\.html)?$/.test(url.pathname);
  const asset=font||(same&&/\.(png|webmanifest)$/.test(url.pathname));
  if(!page&&!asset) return; /* alles andere (Download-Datei, update.json, library.json) direkt aus dem Netz */
  if(page){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const net=fetch(req).then(r=>{ if(r.ok) c.put("./",r.clone()); return r; });
      try{ return await Promise.race([net,new Promise((_,rej)=>setTimeout(()=>rej(new Error("langsam")),4000))]); }
      catch(err){ const hit=await c.match("./"); if(hit){ net.catch(()=>{}); return hit; } return net; }
    })());
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req); if(hit) return hit;
    const r=await fetch(req); if(r.ok||r.type==="opaque") c.put(req,r.clone()); return r;
  }));
});
