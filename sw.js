const CACHE_NAME = "tmcc-cache-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  /*
   * Supabase / external API requests should
   * continue normally through the network.
   */
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            });
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {

            if (cachedResponse) {
              return cachedResponse;
            }

            return caches.match("./index.html");
          });
      })
  );
});
