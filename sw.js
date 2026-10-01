/* Kişisel Yönetim Paneli - Service Worker
   Uygulamada değişiklik yaptığında VERSION değerini artır (v2, v3...) ki cihazlar yeni sürümü alsın. */
const VERSION='kyp-v1',FONTS=VERSION+'-fonts';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==VERSION&&k!==FONTS).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);

  // Sayfa açılışı: önce ağ, internet yoksa önbellekteki index.html
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return res})
      .catch(()=>caches.match('index.html')));
    return;
  }
  // Kendi dosyalarımız: önce önbellek
  if(u.origin===location.origin){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));return res})));
    return;
  }
  // Google Fonts: önbellekten ver, arka planda yenile
  if(/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r).then(hit=>{
      const net=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>hit);
      return hit||net;
    })));
  }
});
