const CACHE = 'balcao-v1';
const URLS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Não interceptar API/Google
  if (/workers\.dev|accounts\.google|googleapis|googleusercontent|gstatic|jsdelivr|unpkg/.test(url)) return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(resp => {
        const fetchP = fetch(e.request).then(net => {
          if (net && net.status === 200 && net.type === 'basic') cache.put(e.request, net.clone());
          return net;
        }).catch(() => resp);
        return resp || fetchP;
      })
    )
  );
});
