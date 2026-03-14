/**
 * Composable para gerenciar instalação PWA
 * Captura o evento beforeinstallprompt e fornece métodos para instalação
 */

export const usePWAInstall = () => {
  const isInstalled = ref(false)
  const canInstall = ref(false)
  const deferredPrompt = ref<any>(null)
  const showInstallButton = ref(false)

  // Verificar se o app já está instalado
  const checkIfInstalled = () => {
    // Verificar se está em modo standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    // Verificar para iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isStandalone || (isIOS && isSafari && (navigator as any).standalone)) {
      isInstalled.value = true
      showInstallButton.value = false
    }
  }

  // Capturar evento beforeinstallprompt
  const captureInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que o prompt padrão apareça
      e.preventDefault()
      
      // Guardar o evento para usar depois
      deferredPrompt.value = e
      
      // Habilitar instalação
      canInstall.value = true
      showInstallButton.value = true
      
      console.log('PWA install prompt captured')
    })
  }

  // Instalar PWA
  const installPWA = async () => {
    if (!deferredPrompt.value) {
      console.error('No install prompt available')
      return false
    }

    try {
      // Mostrar o prompt de instalação
      deferredPrompt.value.prompt()
      
      // Aguardar a resposta do usuário
      const { outcome } = await deferredPrompt.value.userChoice
      
      console.log(`User response to install prompt: ${outcome}`)
      
      // Limpar o prompt guardado
      deferredPrompt.value = null
      showInstallButton.value = false
      
      if (outcome === 'accepted') {
        isInstalled.value = true
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }

  // Verificar se o navegador suporta instalação PWA
  const checkPWAInstallSupport = () => {
    const isSupported = 
      'BeforeInstallPromptEvent' in window ||
      (window as any).beforeinstallprompt !== undefined
    
    console.log('PWA install support:', isSupported)
    return isSupported
  }

  // Inicializar
  onMounted(() => {
    checkIfInstalled()
    captureInstallPrompt()
    
    // Verificar novamente quando a página for focada (útil para iOS)
    window.addEventListener('focus', checkIfInstalled)
    
    // Monitorar mudanças no display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      isInstalled.value = e.matches
      showInstallButton.value = !e.matches && canInstall.value
    })
  })

  // Limpar event listeners
  onUnmounted(() => {
    window.removeEventListener('focus', checkIfInstalled)
  })

  return {
    isInstalled,
    canInstall,
    showInstallButton,
    installPWA,
    checkPWAInstallSupport,
    checkIfInstalled
  }
}