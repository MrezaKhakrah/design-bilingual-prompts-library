/* Promptfolio service worker — full offline app shell */
const VERSION = "promptfolio-sw-v2";

const SCOPE = self.registration.scope;
const CORE = ["", "index.html", "manifest.webmanifest", "icons/app-icon.svg", "icons/app-icon.png"].map(
  (p) => new URL(p, SCOPE).toString()
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const sameOrigin = url.origin === self.location.origin;

  // App navigations → cached app shell (offline-first)
  if (req.mode === "navigate") {
    event.respondWith(
      caches
        .match(new URL("index.html", SCOPE).toString())
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match(new URL("index.html", SCOPE).toString()))
    );
    return;
  }

  // Same-origin assets + Google Fonts → cache-first with background refill
  if (sameOrigin || isFont || CORE.includes(req.url)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const refill = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) {
              const copy = res.clone();
              caches.open(VERSION).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || refill;
      })
    );
  }
});
