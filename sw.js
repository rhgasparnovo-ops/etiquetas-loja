const CACHE = 'balcao-v999';
const URLS = ['./', './index.html?v=999', './manifest.json?v=999'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Não interceptar API/Google/CDNs externas
  if (/workers\.dev|accounts\.google|googleapis|googleusercontent|gstatic|jsdelivr|unpkg/.test(url)) return;

  // Network-first: sempre tenta rede, só usa cache se falhar
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(net => {
        if (net && net.status === 200 && net.type === 'basic') {
          const clone = net.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return net;
      })
      .catch(() => caches.match(e.request).then(cached => cached || new Response('', { status: 503 })))
  );
});
