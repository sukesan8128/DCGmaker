const CACHE_NAME = "dcgmaker-v11";

const CORE_ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./assets/generated/scene-background.png",
  "./assets/generated/frame-monster-bronze.png",
  "./assets/generated/frame-monster-silver.png",
  "./assets/generated/frame-monster-gold.png",
  "./assets/generated/frame-monster-legendary.png",
  "./assets/generated/frame-spell-bronze.png",
  "./assets/generated/frame-spell-silver.png",
  "./assets/generated/frame-spell-gold.png",
  "./assets/generated/frame-spell-legendary.png",
  "./assets/generated/frame-field-bronze.png",
  "./assets/generated/frame-field-silver.png",
  "./assets/generated/frame-field-gold.png",
  "./assets/generated/frame-field-legendary.png",
  "./assets/generated/status-mana.png",
  "./assets/generated/status-attack.png",
  "./assets/generated/status-hp.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./");
          }
          return Response.error();
        });
    }),
  );
});
