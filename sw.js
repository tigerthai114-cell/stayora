const CACHE = "stayora-v1";
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html"))) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open(CACHE).then(ch => ch.match(req).then(hit => {
      const net = fetch(req).then(res => { ch.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Stayora", { body: d.body || "", tag: d.tag, data: { url: d.url || "./" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || "./");
  }));
});
