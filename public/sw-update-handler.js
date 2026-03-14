// Service Worker Update Handler para Agenda-PWA
// Este script é importado pelo Workbox para gerenciar atualizações automáticas

console.log('🔄 Agenda-PWA Update Handler carregado');

// Versão atual do app (será substituída durante o build)
const APP_VERSION = 'v1.0.0-' + Date.now();

// Cache names com versionamento
const CACHE_NAMES = {
  PAGES: `agenda-pages-${APP_VERSION}`,
  IMAGES: `agenda-images-${APP_VERSION}`,
  ASSETS: `agenda-assets-${APP_VERSION}`,
  FONTS: `agenda-fonts-${APP_VERSION}`
};

// Evento: Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalando...', APP_VERSION);
  
  // Pular a fase de waiting e ativar imediatamente
  self.skipWaiting();
  
  // Limpar caches antigos durante a instalação
  event.waitUntil(
    clearOldCaches()
      .then(() => {
        console.log('🗑️  Caches antigos limpos durante instalação');
      })
      .catch(error => {
        console.error('❌ Erro ao limpar caches antigos:', error);
      })
  );
});

// Evento: Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker ativando...', APP_VERSION);
  
  // Tomar controle imediato de todas as abas
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      clearOldCaches()
    ])
    .then(() => {
      console.log('🎯 Service Worker pronto e controlando páginas');
      
      // Enviar mensagem para todas as abas sobre a nova versão
      sendUpdateNotificationToClients();
    })
  );
});

// Evento: Fetch (interceptar requisições)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições para APIs externas
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Estratégia: Network First para HTML, Cache First para assets
  if (event.request.mode === 'navigate') {
    // Para navegação: tentar rede primeiro, depois cache
    event.respondWith(
      networkFirstWithCacheFallback(event)
    );
  } else if (url.pathname.match(/\.(js|css)$/)) {
    // Para JS/CSS: Network First com timeout curto
    event.respondWith(
      networkFirstWithTimeout(event, 2000) // 2 segundos timeout
    );
  }
});

// Estratégia: Network First com fallback para cache
async function networkFirstWithCacheFallback(event) {
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(event.request);
    
    // Se sucesso, atualizar cache
    const cache = await caches.open(CACHE_NAMES.PAGES);
    cache.put(event.request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Rede falhou, usando cache:', event.request.url);
    
    // Fallback para cache
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não houver cache, retornar página offline
    return caches.match('/offline.html');
  }
}

// Estratégia: Network First com timeout
async function networkFirstWithTimeout(event, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const networkResponse = await fetch(event.request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Atualizar cache
    const cache = await caches.open(CACHE_NAMES.ASSETS);
    cache.put(event.request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Fallback para cache
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      console.log('⏱️  Timeout, usando cache:', event.request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Limpar caches antigos (de versões anteriores)
async function clearOldCaches() {
  const cacheKeys = await caches.keys();
  const currentCacheNames = Object.values(CACHE_NAMES);
  
  const cachesToDelete = cacheKeys.filter(cacheKey => {
    // Manter apenas caches da versão atual
    return !currentCacheNames.some(currentName => 
      cacheKey.includes('agenda-') && !cacheKey.includes(APP_VERSION)
    );
  });
  
  console.log(`🗑️  Limpando ${cachesToDelete.length} caches antigos...`);
  
  return Promise.all(
    cachesToDelete.map(cacheKey => {
      console.log(`   Removendo: ${cacheKey}`);
      return caches.delete(cacheKey);
    })
  );
}

// Enviar notificação de atualização para todas as abas
function sendUpdateNotificationToClients() {
  self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        message: 'Nova versão do Agenda-PWA disponível!'
      });
    });
    
    if (clients.length > 0) {
      console.log(`📨 Notificação enviada para ${clients.length} cliente(s)`);
    }
  });
}

// Evento: Mensagem do cliente
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem do cliente:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CHECK_FOR_UPDATES':
      checkForUpdates();
      break;
      
    case 'CLEAR_CACHE':
      clearAllAgendaCaches();
      break;
  }
});

// Verificar atualizações periodicamente
async function checkForUpdates() {
  try {
    const registration = await self.registration;
    await registration.update();
    console.log('🔍 Verificação de atualizações realizada');
  } catch (error) {
    console.error('❌ Erro ao verificar atualizações:', error);
  }
}

// Limpar TODOS os caches do Agenda-PWA
async function clearAllAgendaCaches() {
  const cacheKeys = await caches.keys();
  const agendaCaches = cacheKeys.filter(key => key.includes('agenda-'));
  
  console.log(`🧹 Limpando ${agendaCaches.length} caches do Agenda-PWA...`);
  
  await Promise.all(
    agendaCaches.map(key => caches.delete(key))
  );
  
  console.log('✅ Todos os caches do Agenda-PWA limpos');
  
  // Recarregar todas as abas
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'RELOAD_PAGE',
        reason: 'cache_cleared'
      });
    });
  });
}

// Evento: Sync (para atualizações em background)
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-updates') {
    console.log('🔄 Sync: Verificando atualizações em background');
    event.waitUntil(checkForUpdates());
  }
});

// Evento: Push (notificações push)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova atualização disponível para o Agenda-PWA',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'agenda-update',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Agenda-PWA', options)
  );
});

// Evento: Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Focar em uma aba existente se disponível
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Abrir nova aba se não existir
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Função auxiliar: Verificar se é uma nova versão
function isNewVersionAvailable() {
  // Esta função seria chamada periodicamente para verificar novas versões
  // Em produção, faria uma requisição para um endpoint de versão
  return false; // Placeholder
}

// Exportar para testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_NAMES,
    clearOldCaches,
    clearAllAgendaCaches,
    checkForUpdates
  };
}