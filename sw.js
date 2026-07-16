/* Service worker: programul funcționează și offline (semnal slab la festival).
   index.html și program.js se cer întâi de pe rețea (date proaspete) cu
   fallback la cache; fonturile și imaginile vin direct din cache. */
const CACHE = 'pi21-2'; /* bump la orice schimbare de imagini/fonturi */
const ASSETS = [
  './',
  'index.html',
  'program.js',
  'live.js',
  'fonts/soehne-buch.woff2',
  'fonts/soehne-halbfett.woff2',
  'assets/eticheta-ideoideis.png',
  'assets/favicon.png',
  'assets/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || req.url.includes('program.js') || req.url.includes('live.js');
  if (fresh) {
    /* network-first: date proaspete când există net, cache când nu */
    e.respondWith(
      fetch(req).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return r;
      }).catch(() =>
        caches.match(req).then(r => r || caches.match('index.html'))
      )
    );
  } else {
    /* cache-first pentru fonturi/imagini */
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(rr => {
        const cp = rr.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return rr;
      }))
    );
  }
});
