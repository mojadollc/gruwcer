const CACHE_NAME = "88seven-v7"
const OFFLINE_URL = "/offline.html"
const STATIC_ASSETS = [
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

// Install — cache static assets + offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...STATIC_ASSETS, OFFLINE_URL]))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — smart caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, API, and external requests
  if (request.method !== "GET") return
  if (url.pathname.startsWith("/api/")) return
  if (url.hostname !== self.location.hostname) return

  // Next.js build assets — network first (content-hashed filenames ensure freshness)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Next.js data/RSC requests — network first
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Navigation requests — network only, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // JS/CSS — network first (always fresh bundles)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Images/fonts — cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return res
        }).catch(() => new Response("", { status: 404 }))
      })
    )
    return
  }

  // Everything else — network first
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return res
      })
      .catch(() => caches.match(request))
  )
})

// Force activate immediately when told to skip waiting
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "88 Seven", body: "You have a new notification" }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "default",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
      actions: data.actions || [],
    })
  )
})

// Notification click — open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// Background sync (for offline order submissions)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(syncPendingOrders())
  }
})

async function syncPendingOrders() {
  // Placeholder for future offline order sync
  return Promise.resolve()
}
