// Service Worker Notification Handler para Agenda-PWA
// Este script é importado pelo Workbox para gerenciar notificações agendadas

console.log('🔔 Agenda-PWA Notification Handler carregado');

// Chave para armazenar notificações agendadas no IndexedDB do Service Worker
const NOTIFICATION_DB_NAME = 'agenda-notifications';
const NOTIFICATION_STORE_NAME = 'scheduled-notifications';

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
      scheduledTime: notification.scheduledTime.getTime() // Salvar como timestamp
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
        await saveScheduledNotification(notification);
        
        // Mostrar notificação
        await showNotification(notification);
        
        // Remover após mostrar (opcional, pode manter para histórico)
        await removeScheduledNotification(notification.id);
      }
    }
    
    return pending.length;
  } catch (error) {
    console.error('❌ Erro ao verificar notificações pendentes:', error);
    return 0;
  }
}

// Evento: Periodic Sync (para verificar notificações em background)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    console.log('🔄 Periodic Sync: Verificando notificações em background');
    event.waitUntil(checkPendingNotifications());
  }
});

// Evento: Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('⚡ Notification Handler ativado');
  
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
  
  // Limpar notificações antigas
  event.waitUntil(cleanupOldNotifications());
});

// Evento: Mensagem do cliente
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem do cliente (Notification Handler):', event.data);
  
  switch (event.data.type) {
    case 'SCHEDULE_NOTIFICATION':
      event.waitUntil(
        saveScheduledNotification(event.data.notification)
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
        removeScheduledNotification(event.data.notificationId)
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

// Função para iniciar verificação periódica de notificações
function startNotificationChecker() {
  // Verificar notificações a cada minuto quando o service worker está ativo
  setInterval(async () => {
    await checkPendingNotifications();
  }, 60000); // 1 minuto
  
  console.log('⏰ Verificador de notificações iniciado');
}

// Iniciar quando o service worker for instalado
self.addEventListener('install', (event) => {
  console.log('✅ Notification Handler instalado');
  self.skipWaiting();
});

// Iniciar verificador quando ativado
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

// Exportar para testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initNotificationDB,
    saveScheduledNotification,
    loadScheduledNotifications,
    removeScheduledNotification,
    cleanupOldNotifications,
    checkPendingNotifications,
    showNotification
  };
}