/**
 * Composable para gerenciar notificações com alertas sonoros e visuais
 * para lembretes e compromissos da agenda
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
}

export const useNotifications = () => {
  const scheduledNotifications = ref<ScheduledNotification[]>([])
  const isPermissionGranted = ref(false)
  const isSupported = ref(false)
  const audioContext = ref<AudioContext | null>(null)
  const notificationSound = ref<AudioBuffer | null>(null)

  // Verificar suporte a notificações
  const checkSupport = () => {
    // Verificar se estamos no cliente (não no servidor)
    if (typeof window === 'undefined') {
      isSupported.value = false
      return false
    }
    
    const supported = 'Notification' in window && 'AudioContext' in window
    isSupported.value = supported
    console.log('Notification support:', supported)
    return supported
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

  // Agendar notificação para um lembrete/compromisso
  const scheduleNotification = (
    type: 'reminder' | 'appointment',
    itemId: string,
    title: string,
    scheduledTime: Date
  ): string => {
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      type,
      itemId,
      title,
      scheduledTime,
      notificationId
    }

    scheduledNotifications.value.push(scheduledNotification)
    console.log('Notification scheduled:', scheduledNotification)

    // Configurar timeout para a notificação
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
  }

  // Cancelar notificação agendada
  const cancelScheduledNotification = (notificationId: string) => {
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.id !== notificationId)
    console.log('Notification cancelled:', notificationId)
  }

  // Cancelar todas as notificações de um item
  const cancelAllNotificationsForItem = (itemId: string) => {
    const cancelled = scheduledNotifications.value.filter(n => n.itemId === itemId)
    scheduledNotifications.value = scheduledNotifications.value.filter(n => n.itemId !== itemId)
    console.log('Cancelled notifications for item:', itemId, cancelled)
  }

  // Verificar notificações pendentes
  const getPendingNotifications = () => {
    return scheduledNotifications.value
  }

  // Limpar todas as notificações agendadas
  const clearAllScheduledNotifications = () => {
    scheduledNotifications.value = []
    console.log('All scheduled notifications cleared')
  }

  // Inicializar
  onMounted(async () => {
    // Só inicializar no cliente
    if (typeof window === 'undefined') {
      return
    }
    
    checkSupport()
    
    if (isSupported.value) {
      await requestPermission()
      await loadNotificationSound()
    }

    // Verificar notificações pendentes a cada minuto
    setInterval(() => {
      const now = new Date()
      scheduledNotifications.value.forEach(notification => {
        if (notification.scheduledTime <= now) {
          triggerScheduledNotification(notification.id)
        }
      })
    }, 60000) // Verificar a cada minuto
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
    vibrateDevice
  }
}
