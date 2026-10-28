// Offline support for the web/Windows install: app files are precached and refreshed in the background.
const CACHE = "planner-v6";
const APP = [
  "./", "./index.html", "./privacy.html", "./terms.html", "./cookies.html", "./legal.css", "./theme.js", "./styles.css", "./app.js", "./sync.js", "./config.js", "./manifest.webmanifest",
  "./vendor/supabase.js", "./fonts/bricolage.woff2", "./fonts/figtree.woff2", "./fonts/jetbrains-mono.woff2",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // sign-in and sync requests always go to the network
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || caches.match("./index.html"));
      return hit || net;
    })
  );
});
