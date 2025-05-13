// Nome do cache
const CACHE_NAME = "acai-admin-v2"

// Arquivos para cache inicial
const urlsToCache = [
  "/admin",
  "/admin?source=pwa",
  "/admin-manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-icon-192.png",
  "/maskable-icon-512.png",
  "/screenshot1.png",
  "/screenshot2.png",
]

// Instalar o service worker e fazer cache dos recursos iniciais
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cache aberto")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("[Service Worker] Instalação concluída")
        return self.skipWaiting()
      }),
  )
})

// Ativar o service worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Removendo cache antigo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[Service Worker] Ativação concluída")
        return self.clients.claim()
      }),
  )
})

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retornar resposta do cache
      if (response) {
        return response
      }

      // Clonar a requisição
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Verificar se recebemos uma resposta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clonar a resposta
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})
