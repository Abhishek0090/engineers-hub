// StudyHub service worker: makes the app installable and usable offline.
//
// Strategy
//   /_next/static/*, /pwa-icon/*, fonts   cache first (file names are content-hashed)
//   page navigations                      network first; on failure the last cached copy of
//                                          that page, else /offline
//   everything else (API, RSC payloads)   network only, never cached
//
// Pages are cached as you visit them, so lessons and tracks you opened once still work on a
// train. Progress in JSON mode lives in localStorage, so practice also works offline.
// Bump VERSION to drop every old cache on the next visit. Logging out clears all caches.
const VERSION = "v1";
const STATIC_CACHE = `studyhub-static-${VERSION}`;
const PAGE_CACHE = `studyhub-pages-${VERSION}`;
const PRECACHE = ["/offline", "/manifest.webmanifest", "/pwa-icon/192.png", "/pwa-icon/512.png"];
const MAX_PAGES = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("studyhub-") && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-caches") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/") || /\.(woff2?|png|svg|ico)$/.test(url.pathname);

async function trimPages() {
  const cache = await caches.open(PAGE_CACHE);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(key);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    // Only keep real pages: not redirects (to /login), errors or the login page itself.
    const url = new URL(response.url || request.url);
    if (response.ok && !response.redirected && url.pathname !== "/login") {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      trimPages();
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: false });
    return cached || (await caches.match("/offline")) || new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isStatic(url)) event.respondWith(cacheFirst(request));
  // Anything else goes straight to the network.
});
