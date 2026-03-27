// Service Worker principal para Agenda PWA
// Este Service Worker gerencia cache, atualizações e notificações

const CACHE_NAME = 'agenda-pwa-v1';
const NOTIFICATION_DB_NAME = 'agenda-notifications';
const NOTIFICATION_STORE_NAME = 'scheduled-notifications';

// URLs para cache
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/favicon.ico',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto, adicionando URLs ao cache...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Cache preenchido com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro ao preencher cache:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker ativando...');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Removendo cache antigo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Caches antigos removidos');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }

        // Buscar da rede
        return fetch(event.request)
          .then((response) => {
            // Não cachear respostas inválidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar resposta para cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Inicializar IndexedDB para notificações
async function initNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIFICATION_DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Criar store para notificações agendadas
      if (!db.objectStoreNames.contains(NOTIFICATION_STORE_NAME)) {
        const store = db.createObjectStore(NOTIFICATION_STORE_NAME, { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
        store.createIndex('fired', 'fired', { unique: false });
        store.createIndex('itemId', 'itemId', { unique: false });
        console.log('📊 IndexedDB para notificações criado');
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error('❌ Erro ao abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Salvar notificação agendada no IndexedDB
async function saveScheduledNotification(notification) {
  try {
    const db = await initNotificationDB();
    const transaction = db.transaction([NOTIFICATION_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE_NAME);
    
    await store.put({
      ...notification,
      scheduledTime: notification.scheduledTime // Já é timestamp
    });
    
    console.log('💾 Notificação salva no IndexedDB:', notification.id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar notificação:', error);
    return false;
  }
}

// Carregar notificações agendadas do IndexedDB
async function loadScheduledNotifications() {
  try {
    const db = await initNotificationDB();
    const transaction = db.transaction([NOTIFICATION_STORE_NAME], 'readonly');
    const store = transaction.objectStore(NOTIFICATION_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const notifications = event.target.result.map(item => ({
          ...item,
          scheduledTime: new Date(item.scheduledTime) // Converter de volta para Date
        }));
        console.log(`📋 ${notifications.length} notificações carregadas do IndexedDB`);
        resolve(notifications);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('❌ Erro ao carregar notificações:', error);
    return [];
  }
}

// Remover notificação do IndexedDB
async function removeScheduledNotification(notificationId) {
  try {
    const db = await initNotificationDB();
    const transaction = db.transaction([NOTIFICATION_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE_NAME);
    
    await store.delete(notificationId);
    console.log('🗑️ Notificação removida do IndexedDB:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover notificação:', error);
    return false;
  }
}

// Limpar todas as notificações do IndexedDB
async function clearAllNotifications() {
  try {
    const db = await initNotificationDB();
    const transaction = db.transaction([NOTIFICATION_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE_NAME);
    
    await store.clear();
    console.log('🧹 Todas as notificações removidas do IndexedDB');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    return false;
  }
}

// Limpar notificações antigas (mais de 7 dias)
async function cleanupOldNotifications() {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const db = await initNotificationDB();
    const transaction = db.transaction([NOTIFICATION_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE_NAME);
    const index = store.index('scheduledTime');
    
    const range = IDBKeyRange.upperBound(sevenDaysAgo);
    const request = index.openCursor(range);
    
    return new Promise((resolve) => {
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          count++;
          cursor.delete();
          cursor.continue();
        } else {
          if (count > 0) {
            console.log(`🧹 ${count} notificações antigas removidas`);
          }
          resolve(count);
        }
      };
      
      request.onerror = (event) => {
        console.error('❌ Erro ao limpar notificações antigas:', event.target.error);
        resolve(0);
      };
    });
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    return 0;
  }
}

// Mostrar notificação
async function showNotification(notificationData) {
  const { type, itemId, title, scheduledTime } = notificationData;
  
  const typeText = type === 'reminder' ? 'Lembrete' : 'Compromisso';
  const icon = type === 'reminder' ? '📌' : '🎯';
  
  const options = {
    body: `Hora do ${typeText.toLowerCase()}!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: `agenda-${type}-${itemId}`,
    requireInteraction: true,
    data: {
      type,
      itemId,
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Agenda'
      },
      {
        action: 'dismiss',
        title: 'Fechar'
      }
    ]
  };
  
  await self.registration.showNotification(`${icon} ${typeText}: ${title}`, options);
  console.log('🔔 Notificação mostrada:', title);
}

// Verificar notificações pendentes
async function checkPendingNotifications() {
  try {
    const now = Date.now();
    const notifications = await loadScheduledNotifications();
    const pending = notifications.filter(n => !n.fired && n.scheduledTime.getTime() <= now);
    
    if (pending.length > 0) {
      console.log(`⏰ ${pending.length} notificações pendentes encontradas`);
      
      for (const notification of pending) {
        // Marcar como disparada
        notification.fired = true;
        await saveScheduledNotification({
          ...notification,
          scheduledTime: notification.scheduledTime.getTime()
        });
        
        // Mostrar notificação
        await showNotification(notification);
        
        // Remover após mostrar
        await removeScheduledNotification(notification.id);
      }
    }
    
    return pending.length;
  } catch (error) {
    console.error('❌ Erro ao verificar notificações pendentes:', error);
    return 0;
  }
}

// Iniciar verificador periódico de notificações
function startNotificationChecker() {
  // Verificar notificações a cada minuto
  setInterval(async () => {
    await checkPendingNotifications();
  }, 60000); // 1 minuto
  
  console.log('⏰ Verificador de notificações iniciado');
}

// Evento: Periodic Sync (para verificar notificações em background)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    console.log('🔄 Periodic Sync: Verificando notificações em background');
    event.waitUntil(checkPendingNotifications());
  }
});

// Evento: Mensagem do cliente
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem do cliente:', event.data);
  
  const { type, ...data } = event.data;
  
  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      event.waitUntil(
        saveScheduledNotification(data.notification)
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch(error => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'CANCEL_NOTIFICATION':
      event.waitUntil(
        removeScheduledNotification(data.notificationId)
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch(error => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'CHECK_NOTIFICATIONS':
      event.waitUntil(
        checkPendingNotifications()
          .then(count => {
            event.ports[0].postMessage({ success: true, count });
          })
          .catch(error => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'LOAD_NOTIFICATIONS':
      event.waitUntil(
        loadScheduledNotifications()
          .then(notifications => {
            event.ports[0].postMessage({ success: true, notifications });
          })
          .catch(error => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'CLEAR_ALL_NOTIFICATIONS':
      event.waitUntil(
        clearAllNotifications()
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch(error => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    default:
      console.warn('⚠️ Tipo de mensagem desconhecido:', type);
      event.ports[0].postMessage({ success: false, error: 'Tipo de mensagem desconhecido' });
  }
});

// Evento: Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Focar em uma aba existente se disponível
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
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

// Evento: Notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notificação fechada:', event.notification.tag);
});

// Iniciar quando ativado
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupOldNotifications()
    ]).then(() => {
      startNotificationChecker();
    })
  );
});

// Registrar periodic sync para verificar notificações a cada hora
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('check-notifications', {
    minInterval: 60 * 60 * 1000, // 1 hora
  }).then(() => {
    console.log('⏰ Periodic Sync registrado para notificações');
  }).catch(error => {
    console.warn('⚠️ Periodic Sync não suportado:', error);
  });
}

// Evento: Push notification
self.addEventListener('push', (event) => {
  console.log('📨 Evento push recebido:', event);
  
  if (!event.data) {
    console.warn('⚠️ Push event sem dados');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('📊 Dados da push notification:', data);
    
    const options = {
      body: data.body || 'Nova notificação da Agenda',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'agenda-push',
      requireInteraction: data.requireInteraction || true,
      data: {
        url: data.url || '/',
        type: data.type || 'push',
        itemId: data.itemId || null
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir Agenda'
        },
        {
          action: 'dismiss',
          title: 'Fechar'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '🔔 Agenda', options)
        .then(() => {
          console.log('✅ Push notification mostrada com sucesso');
        })
        .catch(error => {
          console.error('❌ Erro ao mostrar push notification:', error);
        })
    );
  } catch (error) {
    console.error('❌ Erro ao processar push event:', error);
    
    // Fallback: mostrar notificação simples
    const fallbackOptions = {
      body: 'Nova notificação da Agenda',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'agenda-push-fallback',
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification('🔔 Agenda', fallbackOptions)
    );
  }
});

// Evento: Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription mudou:', event);
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription ? 
        event.oldSubscription.options.applicationServerKey : 
        null
    })
    .then(newSubscription => {
      console.log('✅ Nova inscrição push criada:', newSubscription);
      
      // Aqui você enviaria a nova inscrição para seu servidor
      // Exemplo: fetch('/api/push/resubscribe', { method: 'POST', body: JSON.stringify(newSubscription) })
    })
    .catch(error => {
      console.error('❌ Erro ao criar nova inscrição push:', error);
    })
  );
});

console.log('✅ Service Worker carregado e pronto');
