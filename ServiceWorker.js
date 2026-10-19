const cacheName = "DefaultCompany-RentenLife-2.0";

// Beim Registrieren wird bewusst nichts vorab geladen: Das Spiel soll erst
// heruntergeladen werden, wenn der Spieler es starten darf (siehe index.html).
self.addEventListener('install', function (e) {
    self.skipWaiting();
});

// Alte Versionen des Caches aufraeumen
self.addEventListener('activate', function (e) {
    e.waitUntil((async function () {
      const keys = await caches.keys();
      await Promise.all(keys.filter(function (k) { return k !== cacheName; }).map(function (k) { return caches.delete(k); }));
      await self.clients.claim();
    })());
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') { return; }
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) { return; }

    e.respondWith((async function () {
      const cache = await caches.open(cacheName);

      // Startseite: erst Netzwerk (damit Updates sofort ankommen), offline aus dem Cache
      if (e.request.mode === 'navigate') {
        try {
          const fresh = await fetch(e.request);
          if (fresh.ok) { cache.put(e.request, fresh.clone()); }
          return fresh;
        } catch (err) {
          const cached = await cache.match(e.request, { ignoreSearch: true });
          if (cached) { return cached; }
          throw err;
        }
      }

      // Alles andere: aus dem Cache, sonst laden und merken
      const cached = await cache.match(e.request);
      if (cached) { return cached; }
      const response = await fetch(e.request);
      if (response.ok) { cache.put(e.request, response.clone()); }
      return response;
    })());
});
