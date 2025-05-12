// Nome do cache
const CACHE_NAME = "acai-admin-v1"

// Arquivos para cache inicial
const urlsToCache = [
  "/admin",
  "/admin-manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/screenshots/admin-1.png",
  // Adicione outros recursos estáticos importantes aqui
]

// Instalar o service worker e fazer cache dos recursos iniciais
self.addEventListener("install", (event) => {
  console.log("Service Worker sendo instalado")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache aberto")
      return cache.addAll(urlsToCache)
    }),
  )
  // Ativar imediatamente sem esperar por recarregamentos
  self.skipWaiting()
})

// Estratégia de cache: Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, cloná-la e armazená-la no cache
        if (event.request.method === "GET" && response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Se a rede falhar, tente buscar do cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Se não estiver no cache e for uma página HTML, retorne a página offline
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/admin")
          }
          // Caso contrário, retorne um erro
          return new Response("Offline e não encontrado no cache", {
            status: 503,
            statusText: "Serviço Indisponível",
          })
        })
      }),
  )
})

// Limpar caches antigos quando uma nova versão do service worker for ativada
self.addEventListener("activate", (event) => {
  console.log("Service Worker ativado")
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Limpando cache antigo:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  // Reivindicar o controle imediatamente
  self.clients.claim()
})
