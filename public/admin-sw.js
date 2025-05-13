// Nome do cache para o admin
const CACHE_NAME = "acai-admin-cache-v1"

// Arquivos a serem cacheados inicialmente
const urlsToCache = [
  "/admin",
  "/admin-manifest.json",
  "/icons/admin-icon-192.png",
  "/icons/admin-icon-512.png",
  "/acai-logo.png",
]

// Instalação do service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Estratégia de cache: network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Apenas interceptar requisições que começam com /admin
  if (!event.request.url.includes("/admin")) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clone-a e armazene-a no cache
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Se falhar, tente buscar do cache
        return caches.match(event.request)
      }),
  )
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
