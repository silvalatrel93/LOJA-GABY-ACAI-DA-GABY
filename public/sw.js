// Nome do cache
const CACHE_NAME = 'heai-acai-cache-v1';

// Arquivos para cache inicial
const urlsToCache = [
  '/',
  '/admin',
  '/offline.html',
  '/manifest.json',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder-logo.svg',
  '/sounds/new-order.mp3',
  '/sounds/new-table-order.mp3'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de cache: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
  // Para arquivos de áudio, sempre buscar da rede para garantir reprodução
  if (event.request.url.includes('/sounds/') && event.request.url.match(/\.(mp3|wav|ogg)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          console.log('Arquivo de áudio carregado da rede:', event.request.url);
          return response;
        })
        .catch(() => {
          console.log('Tentando carregar áudio do cache:', event.request.url);
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clone-a e armazene-a no cache
        if (event.request.method === 'GET' && response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tente buscar do cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }

            // Para navegação, retorne a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }

            return new Response('Não foi possível conectar ao servidor.');
          });
      })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados quando online
async function syncData() {
  // Aqui implementaremos a lógica para sincronizar dados armazenados localmente
  // quando o dispositivo estiver online novamente
  const dataToSync = await getLocalData();
  if (dataToSync && dataToSync.length > 0) {
    try {
      // Enviar dados para o servidor
      await sendToServer(dataToSync);
      // Limpar dados locais após sincronização bem-sucedida
      await clearLocalData();
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
    }
  }
}

// Funções auxiliares para manipulação de dados locais
async function getLocalData() {
  // Implementação para recuperar dados armazenados localmente
  return [];
}

async function sendToServer(data) {
  // Implementação para enviar dados ao servidor
}

async function clearLocalData() {
  // Implementação para limpar dados locais após sincronização
}

// Notificações push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ação ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
