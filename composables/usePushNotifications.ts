/**
 * Composable para gerenciar notificações push com VAPID
 * Implementação completa de Web Push API
 */

// Chave pública VAPID gerada
const VAPID_PUBLIC_KEY = 'BPj2yC3g73AGmXUE6PytV2fZpXC7jpE379n63FVmWucmpVLekJnlKiXo1SLusoAFPctsJ-62JBLtDEt6r79pt_o';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const subscription = ref<PushSubscription | null>(null);
  const registration = ref<ServiceWorkerRegistration | null>(null);

  // Verificar suporte a push notifications
  const checkSupport = () => {
    if (typeof window === 'undefined') {
      isSupported.value = false;
      return false;
    }

    const supported = 'PushManager' in window && 'serviceWorker' in navigator;
    isSupported.value = supported;
    console.log('Push notifications support:', supported);
    return supported;
  };

  // Registrar Service Worker para push
  const registerServiceWorkerForPush = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported.value) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      registration.value = reg;
      console.log('Service Worker registered for push:', reg);
      return reg;
    } catch (error) {
      console.error('Error registering Service Worker for push:', error);
      return null;
    }
  };

  // Solicitar permissão para notificações push
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported.value) {
      console.warn('Push notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Push notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return 'denied';
    }
  };

  // Inscrever para notificações push
  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    if (!isSupported.value || !registration.value) {
      console.warn('Push notifications not supported or Service Worker not registered');
      return null;
    }

    try {
      // Verificar permissão
      const permission = await requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Inscrever com chave VAPID
      const sub = await registration.value.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
      });

      subscription.value = sub;
      isSubscribed.value = true;
      
      console.log('Subscribed to push notifications:', sub);
      saveSubscription(sub);
      
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  // Cancelar inscrição
  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!subscription.value) {
      console.warn('No active subscription to unsubscribe from');
      return false;
    }

    try {
      const success = await subscription.value.unsubscribe();
      if (success) {
        subscription.value = null;
        isSubscribed.value = false;
        clearSubscription();
        console.log('Unsubscribed from push notifications');
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  // Verificar inscrição atual
  const checkSubscription = async (): Promise<PushSubscription | null> => {
    if (!registration.value) {
      console.warn('Service Worker not registered');
      return null;
    }

    try {
      const sub = await registration.value.pushManager.getSubscription();
      subscription.value = sub;
      isSubscribed.value = !!sub;
      
      if (sub) {
        console.log('Current push subscription found:', sub);
        saveSubscription(sub);
      } else {
        console.log('No active push subscription');
      }
      
      return sub;
    } catch (error) {
      console.error('Error checking push subscription:', error);
      return null;
    }
  };

  // Salvar inscrição no localStorage
  const saveSubscription = (sub: PushSubscription) => {
    if (typeof window === 'undefined') return;
    
    try {
      const subData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!)))
        }
      };
      
      localStorage.setItem('push-subscription', JSON.stringify(subData));
      console.log('Push subscription saved to localStorage');
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  };

  // Carregar inscrição do localStorage
  const loadSubscription = (): PushSubscriptionData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem('push-subscription');
      if (data) {
        const parsed = JSON.parse(data);
        console.log('Push subscription loaded from localStorage');
        return parsed;
      }
    } catch (error) {
      console.error('Error loading push subscription:', error);
    }
    
    return null;
  };

  // Limpar inscrição
  const clearSubscription = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('push-subscription');
    console.log('Push subscription cleared from localStorage');
  };

  // Enviar inscrição para o servidor (se tiver backend)
  const sendSubscriptionToServer = async (sub: PushSubscription): Promise<boolean> => {
    try {
      // Aqui você enviaria a inscrição para seu backend
      // Exemplo com fetch:
      // const response = await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(sub)
      // });
      
      // return response.ok;
      
      console.log('Subscription ready to send to server:', sub);
      return true; // Placeholder
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  };

  // Testar notificação push (simulação)
  const testPushNotification = async (): Promise<boolean> => {
    if (!isSubscribed.value || !subscription.value) {
      console.warn('Not subscribed to push notifications');
      return false;
    }

    try {
      // Em produção, você enviaria uma requisição para seu backend
      // que enviaria uma notificação push real
      console.log('Test push notification would be sent to:', subscription.value.endpoint);
      
      // Para teste local, podemos mostrar uma notificação local
      if ('serviceWorker' in navigator && registration.value) {
        registration.value.showNotification('🔔 Teste Push', {
          body: 'Esta é uma notificação push de teste!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'test-push',
          requireInteraction: true
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error testing push notification:', error);
      return false;
    }
  };

  // Inicializar (deve ser chamado em setup() do componente)
  const initialize = async () => {
    if (typeof window === 'undefined') return;
    
    checkSupport();
    
    if (isSupported.value) {
      await registerServiceWorkerForPush();
      await checkSubscription();
    }
  };

  return {
    // Estado
    isSupported,
    isSubscribed,
    subscription,
    
    // Métodos
    checkSupport,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    checkSubscription,
    testPushNotification,
    initialize,
    sendSubscriptionToServer
  };
};

// Helper: Converter chave VAPID para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}