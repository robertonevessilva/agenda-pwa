/**
 * Composable para gerenciar notificações com alertas sonoros e visuais
 * para lembretes e compromissos da agenda
 * 
 * IMPORTANTE: Esta versão usa Service Worker para notificações em segundo plano
 * e funciona mesmo quando o app está fechado ou em segundo plano.
 */

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  sound?: string
  vibrate?: number[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

export interface ScheduledNotification {
  id: string
  type: 'reminder' | 'appointment'
  itemId: string
  title: string
  scheduledTime: Date
  notificationId?: string
  fired: boolean
}

export const useNotifications = () => {
  const scheduledNotifications = ref<ScheduledNotification[]>([])
  const isPermissionGranted = ref(false)
  const isSupported = ref(false)
  const audioContext = ref<AudioContext | null>(null)
  const notificationSound = ref<AudioBuffer | null>(null)
  const STORAGE_KEY = 'agenda-scheduled-notifications'
  const serviceWorkerRegistration = ref<ServiceWorkerRegistration | null>(null)

  // Verificar suporte a notificações e Service Worker
  const checkSupport = () => {
    if (typeof window === 'undefined') {
      isSupported.value = false
      return false
    }
    
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    isSupported.value = supported
    console.log('Notification and Service Worker support:', supported)
    return supported
  }

  // Registrar Service Worker com fallback robusto
  const registerServiceWorker = async (): Promise<boolean> => {
    if (!isSupported.value || typeof navigator === 'undefined') {
      console.warn('Service Worker not supported')
      return false
    }

    try {
      // Tentar registrar o Service Worker do Workbox
      let registration: ServiceWorkerRegistration | null = null
      
      // Primeira tentativa: usar o Service Worker gerado pelo Workbox
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })
        console.log('✅ Service Worker registrado com sucesso:', registration)
      } catch (swError) {
        console.warn('⚠️ Falha ao registrar /sw.js, tentando fallback...', swError)
        
        // Segunda tentativa: tentar registrar sem opções específicas
        try {
          registration = await navigator.serviceWorker.register('/sw.js')
          console.log('✅ Service Worker registrado com fallback:', registration)
        } catch (fallbackError) {
          console.error('❌ Falha no fallback do Service Worker:', fallbackError)
          return false
        }
      }
      
      if (!registration) {
        console.error('❌ Service Worker registration é null')
        return false
      }
      
      serviceWorkerRegistration.value = registration
      
      // Aguardar o Service Worker estar ativo com timeout
      const waitForActivation = new Promise<boolean>((resolve) => {
        if (registration!.active) {
          console.log('✅ Service Worker já está ativo')
          resolve(true)
          return
        }
        
        const worker = registration!.installing || registration!.waiting
        if (!worker) {
          console.warn('⚠️ Nenhum worker encontrado (installing ou waiting)')
          resolve(false)
          return
        }
        
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Timeout aguardando ativação do Service Worker')
          resolve(false)
        }, 10000) // 10 segundos timeout
        
        worker.addEventListener('statechange', () => {
          console.log(`🔄 Estado do Service Worker: ${worker.state}`)
          if (worker.state === 'activated') {
            clearTimeout(timeoutId)
            console.log('✅ Service Worker ativado')
            resolve(true)
          }
        })
      })
      
      const activated = await waitForActivation
      if (!activated) {
        console.warn('⚠️ Service Worker não foi ativado dentro do timeout')
      }
      
      return true
    } catch (error) {
      console.error('❌ Erro crítico ao registrar Service Worker:', error)
      return false
    }
  }

  // Enviar mensagem para o Service Worker
  const sendMessageToServiceWorker = async (type: string, data: any): Promise<any> => {
    try {
      // Verificar se o Service Worker está registrado e ativo
      if (!serviceWorkerRegistration.value) {
        console.warn('Service Worker not registered')
        return { success: false, error: 'Service Worker not registered' }
      }

      // Aguardar o Service Worker estar pronto
      const registration = await navigator.serviceWorker.ready
      
      if (!registration.active) {
        console.warn('Service Worker not active')
        return { success: false, error: 'Service Worker not active' }
      }

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data)
        }
        
        // Configurar timeout para evitar espera infinita
        const timeoutId = setTimeout(() => {
          resolve({ success: false, error: 'Service Worker timeout' })
        }, 5000)
        
        registration.active!.postMessage(
          { type, ...data },
          [messageChannel.port2]
        )
        
        // Limpar timeout quando receber resposta
        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeoutId)
          resolve(event.data)
        }
      })
    } catch (error) {
      console.error('Error sending message to Service Worker:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value || typeof window === 'undefined') {
      console.warn('Notifications not supported or not in browser environment')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      isPermissionGranted.value = permission === 'granted'
      console.log('Notification permission:', permission)
      return isPermissionGranted.value
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Carregar som de notificação
  const loadNotificationSound = async () => {
    if (typeof window === 'undefined') {
      console.warn('Cannot load sound in server environment')
      return
    }

    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    try {
      // Criar um som de notificação simples (beep)
      const duration = 0.5
      const sampleRate = audioContext.value.sampleRate
      const frameCount = sampleRate * duration
      const buffer = audioContext.value.createBuffer(1, frameCount, sampleRate)
      const data = buffer.getChannelData(0)

      // Gerar um tom de 800Hz
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate
        // Fade in/out para evitar clicks
        const fadeIn = Math.min(1, time / 0.05)
        const fadeOut = Math.min(1, (duration - time) / 0.05)
        const envelope = fadeIn * fadeOut
        data[i] = Math.sin(2 * Math.PI * 800 * time) * envelope * 0.3
      }

      notificationSound.value = buffer
      console.log('Notification sound loaded')
    } catch (error) {
      console.error('Error loading notification sound:', error)
    }
  }

  // Tocar som de notificação
  const playNotificationSound = () => {
    if (typeof window === 'undefined' || !audioContext.value || !notificationSound.value) {
      console.warn('Audio context or sound not available')
      return
    }

    try {
      const source = audioContext.value.createBufferSource()
      source.buffer = notificationSound.value
      source.connect(audioContext.value.destination)
      source.start()
      console.log('Notification sound played')
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  // Vibrar dispositivo (se suportado)
  const vibrateDevice = (pattern: number[] = [200, 100, 200]) => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return
    }

    try {
      navigator.vibrate(pattern)
      console.log('Device vibrated')
    } catch (error) {
      console.error('Error vibrating device:', error)
    }
  }

  // Mostrar notificação
  const showNotification = async (options: NotificationOptions): Promise<Notification | null> => {
    if (typeof window === 'undefined' || !isSupported.value || !isPermissionGranted.value) {
      console.warn('Notifications not supported or permission not granted')
      return null
    }

    try {
      // Tocar som
      playNotificationSound()

      // Vibrar dispositivo
      if (options.vibrate) {
        vibrateDevice(options.vibrate)
      }

      // Criar notificação
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag || 'agenda-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      })

      // Adicionar evento de clique
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-fechar após 10 segundos (se não for requireInteraction)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 10000)
      }

      console.log('Notification shown:', options.title)
      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
      return null
    }
  }

  // Salvar notificações agendadas no localStorage
  const saveScheduledNotifications = () => {
    if (typeof window === 'undefined') return
    
    try {
      const data = scheduledNotifications.value.map(notification => ({
        ...notification,
        scheduledTime: notification.scheduledTime.toISOString()
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('Scheduled notifications saved to localStorage')
    } catch (error) {
      console.error('Error saving scheduled notifications:', error)
    }
  }

  // Carregar notificações agendadas do localStorage
  const loadScheduledNotifications = () => {
    if (typeof window === 'undefined') return
    
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        scheduledNotifications.value = parsed.map((item: any) => ({
          ...item,
          scheduledTime: new Date(item.scheduledTime),
          fired: item.fired || false
        }))
        console.log('Scheduled notifications loaded from localStorage:', scheduledNotifications.value.length)
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error)
    }
  }

  // Agendar notificação para um lembrete/compromisso
  const scheduleNotification = async (
    type: 'reminder' | 'appointment',
    itemId: string,
    title: string,
    scheduledTime: Date
  ): Promise<string> => {
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      type,
      itemId,
      title,
      scheduledTime,
      fired: false
    }

    // Salvar localmente
    scheduledNotifications.value.push(scheduledNotification)
    saveScheduledNotifications()
    console.log('Notification scheduled locally:', scheduledNotification)

    // Enviar para o Service Worker para notificações em segundo plano
    try {
      const result = await sendMessageToServiceWorker('SCHEDULE_NOTIFICATION', {
        notification: {
          ...scheduledNotification,
          scheduledTime: scheduledNotification.scheduledTime.getTime()
        }
      })
      
      if (result.success) {
        console.log('Notification scheduled in Service Worker')
      } else {
        console.warn('Failed to schedule notification in Service Worker:', result.error)
      }
    } catch (error) {
      console.error('Error scheduling notification in Service Worker:', error)
    }

    // Configurar timeout para a notificação (funciona apenas quando app está ativo)
    const now = new Date()
    const timeUntilNotification = scheduledTime.getTime() - now.getTime()

    if (timeUntilNotification > 0) {
      setTimeout(async () => {
        await triggerScheduledNotification(notificationId)
      }, timeUntilNotification)
    } else {
      // Se já passou do horário, mostrar imediatamente
      setTimeout(async () => {
        await triggerScheduledNotification(notificationId)
      }, 1000)
    }

    return notificationId
  }

  // Disparar notificação agendada
  const triggerScheduledNotification = async (notificationId: string) => {
    const notification = scheduledNotifications.value.find(n => n.id === notificationId)
    if (!notification) {
      console.warn('Scheduled notification not found:', notificationId)
      return
    }

    // Marcar como disparada
    notification.fired = true
    saveScheduledNotifications()

    const typeText = notification.type === 'reminder' ? 'Lembrete' : 'Compromisso'
    const icon = notification.type === 'reminder' ? '📌' : '🎯'

    await showNotification({
      title: `${icon} ${typeText}: ${notification.title}`,
      body: `Hora do ${typeText.toLowerCase()}!`,
      icon: '/icon-192.png',
      sound: 'default',
      vibrate: [200, 100, 200],
      tag: `agenda-${notification.type}-${notification.itemId}`,
      requireInteraction: true
    })

    // Remover da lista após disparar
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.id !== notificationId)
    saveScheduledNotifications()

    // Remover do Service Worker
    try {
      await sendMessageToServiceWorker('CANCEL_NOTIFICATION', { notificationId })
    } catch (error) {
      console.error('Error removing notification from Service Worker:', error)
    }
  }

  // Verificar notificações pendentes que deveriam ter sido disparadas
  const checkPendingNotifications = async () => {
    const now = new Date()
    const pending = scheduledNotifications.value.filter(n => !n.fired && n.scheduledTime <= now)
    
    if (pending.length > 0) {
      console.log(`Found ${pending.length} pending notifications to trigger`)
      for (const notification of pending) {
        await triggerScheduledNotification(notification.id)
      }
    }

    // Verificar também no Service Worker
    try {
      const result = await sendMessageToServiceWorker('CHECK_NOTIFICATIONS', {})
      if (result.success && result.count > 0) {
        console.log(`Service Worker found ${result.count} pending notifications`)
      }
    } catch (error) {
      console.error('Error checking notifications in Service Worker:', error)
    }
  }

  // Cancelar notificação agendada
  const cancelScheduledNotification = async (notificationId: string) => {
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.id !== notificationId)
    saveScheduledNotifications()
    console.log('Notification cancelled locally:', notificationId)

    // Cancelar no Service Worker
    try {
      await sendMessageToServiceWorker('CANCEL_NOTIFICATION', { notificationId })
    } catch (error) {
      console.error('Error cancelling notification in Service Worker:', error)
    }
  }

  // Cancelar todas as notificações de um item
  const cancelAllNotificationsForItem = async (itemId: string) => {
    const cancelled = scheduledNotifications.value.filter(n => n.itemId === itemId)
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.itemId !== itemId)
    saveScheduledNotifications()
    console.log('Cancelled notifications for item:', itemId, cancelled.length)

    // Cancelar no Service Worker
    for (const notification of cancelled) {
      try {
        await sendMessageToServiceWorker('CANCEL_NOTIFICATION', { notificationId: notification.id })
      } catch (error) {
        console.error('Error cancelling notification in Service Worker:', error)
      }
    }
  }

  // Verificar notificações pendentes
  const getPendingNotifications = () => {
    return scheduledNotifications.value.filter(n => !n.fired)
  }

  // Limpar todas as notificações agendadas
  const clearAllScheduledNotifications = async () => {
    scheduledNotifications.value = []
    saveScheduledNotifications()
    console.log('All scheduled notifications cleared locally')

    // Limpar no Service Worker
    try {
      await sendMessageToServiceWorker('CLEAR_ALL_NOTIFICATIONS', {})
    } catch (error) {
      console.error('Error clearing notifications in Service Worker:', error)
    }
  }

  // Limpar notificações antigas (mais de 7 dias)
  const cleanupOldNotifications = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const oldCount = scheduledNotifications.value.filter(n => n.scheduledTime < sevenDaysAgo).length
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.scheduledTime >= sevenDaysAgo)
    saveScheduledNotifications()
    
    if (oldCount > 0) {
      console.log(`Cleaned up ${oldCount} old notifications`)
    }
  }

  // Testar notificações
  const testNotification = async () => {
    try {
      // Solicitar permissão se necessário
      if (!isPermissionGranted.value) {
        await requestPermission()
      }

      // Testar notificação
      await showNotification({
        title: '🔔 Teste de Notificação',
        body: 'Esta é uma notificação de teste da Agenda PWA!',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
      })
      
      console.log('✅ Notificação de teste enviada')
      return true
    } catch (error) {
      console.error('Failed to test notification:', error)
      return false
    }
  }

  // Inicializar
  onMounted(async () => {
    // Só inicializar no cliente
    if (typeof window === 'undefined') {
      return
    }
    
    checkSupport()
    loadScheduledNotifications()
    cleanupOldNotifications()
    
    if (isSupported.value) {
      await requestPermission()
      await loadNotificationSound()
      
      // Registrar Service Worker
      await registerServiceWorker()
    }

    // Verificar notificações pendentes a cada minuto (quando app está ativo)
    setInterval(() => {
      checkPendingNotifications()
    }, 60000) // Verificar a cada minuto

    // Verificar notificações quando o app volta ao foco (importante para mobile)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('App became visible, checking pending notifications')
          checkPendingNotifications()
        }
      })
    }

    // Verificar notificações quando a página é carregada
    checkPendingNotifications()
  })

  return {
    // Estado
    isSupported,
    isPermissionGranted,
    scheduledNotifications,
    
    // Métodos
    checkSupport,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelScheduledNotification,
    cancelAllNotificationsForItem,
    getPendingNotifications,
    clearAllScheduledNotifications,
    playNotificationSound,
    vibrateDevice,
    checkPendingNotifications,
    cleanupOldNotifications,
    testNotification
  }
}