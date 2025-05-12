// Nome do cache
const CACHE_NAME = "acai-admin-v1"

// Arquivos para cache inicial
const urlsToCache = ["/admin", "/admin/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"]

// Instalar o service worker e fazer cache dos recursos iniciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Estratégia de cache: Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Apenas interceptar requisições que começam com /admin
  if (event.request.url.includes("/admin")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request)
      }),
    )
  }
})

// Limpar caches antigos quando uma nova versão do service worker for ativada
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
