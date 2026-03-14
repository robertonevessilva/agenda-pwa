// Script de debug para navegação do histórico
export const NavigationDebug = {
  async testNavigation() {
    console.log('🧪 TESTANDO NAVEGAÇÃO DO HISTÓRICO')
    
    // Teste 1: Verificar se router está disponível
    console.log('1. Verificando router...')
    try {
      const { useRouter } = await import('#imports')
      const router = useRouter()
      console.log('✅ Router disponível:', router)
    } catch (error) {
      console.error('❌ Router não disponível:', error)
    }
    
    // Teste 2: Verificar store
    console.log('2. Verificando store...')
    try {
      const { useAgendaStore } = await import('~/stores/agenda')
      const store = useAgendaStore()
      console.log('✅ Store disponível')
      console.log('📊 auditLogs length:', store.auditLogs.length)
      console.log('📋 auditLogs:', store.auditLogs)
    } catch (error) {
      console.error('❌ Store não disponível:', error)
    }
    
    // Teste 3: Testar navegação programática
    console.log('3. Testando navegação...')
    await this.testRouterNavigation()
    await this.testWindowNavigation()
    
    // Teste 4: Verificar Service Worker
    console.log('4. Verificando Service Worker...')
    await this.checkServiceWorker()
    
    console.log('🧪 TESTES COMPLETOS')
  },
  
  async testRouterNavigation() {
    console.log('   Tentando router.push...')
    try {
      const { useRouter } = await import('#imports')
      const router = useRouter()
      router.push('/history')
      console.log('   ✅ router.push executado')
    } catch (error) {
      console.error('   ❌ router.push falhou:', error)
    }
  },
  
  async testWindowNavigation() {
    console.log('   Tentando window.location...')
    try {
      window.location.href = '/history'
      console.log('   ✅ window.location executado')
    } catch (error) {
      console.error('   ❌ window.location falhou:', error)
    }
  },
  
  async checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      console.log('   Service Worker API disponível')
      
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          console.log('   ✅ Service Worker registrado:', registration.scope)
          
          // Verificar se está controlando a página
          if (navigator.serviceWorker.controller) {
            console.log('   ⚠️ Service Worker está controlando a página')
            console.log('   Controller:', navigator.serviceWorker.controller.scriptURL)
          } else {
            console.log('   ℹ️ Service Worker não está controlando a página')
          }
        } else {
          console.log('   ℹ️ Nenhum Service Worker registrado')
        }
      } catch (error) {
        console.error('   ❌ Erro ao verificar Service Worker:', error)
      }
    } else {
      console.log('   ℹ️ Service Worker não suportado')
    }
  },
  
  async clearServiceWorkerCache() {
    console.log('🧹 LIMPANDO CACHE DO SERVICE WORKER')
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          // Desregistrar Service Worker
          await registration.unregister()
          console.log('✅ Service Worker desregistrado')
          
          // Limpar caches
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName)
              console.log(`🗑️ Cache deletado: ${cacheName}`)
            }
          }
          
          // Recarregar página
          console.log('🔄 Recarregando página...')
          window.location.reload()
        }
      } catch (error) {
        console.error('❌ Erro ao limpar cache:', error)
      }
    }
  },
  
  async forceNavigateToHistory() {
    console.log('🚀 FORÇANDO NAVEGAÇÃO PARA HISTÓRICO')
    
    // Tentativa 1: Router
    try {
      const { useRouter } = await import('#imports')
      const router = useRouter()
      router.push('/history')
      console.log('✅ Navegação via router')
      return
    } catch (error) {
      console.log('❌ Router falhou, tentando fallback...')
    }
    
    // Tentativa 2: window.location
    try {
      window.location.href = '/history'
      console.log('✅ Navegação via window.location')
      return
    } catch (error) {
      console.log('❌ window.location falhou, tentando fallback...')
    }
    
    // Tentativa 3: window.open
    try {
      window.open('/history', '_self')
      console.log('✅ Navegação via window.open')
      return
    } catch (error) {
      console.error('❌ Todas as tentativas falharam:', error)
      alert('Erro ao navegar para o histórico. Tente recarregar a página.')
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.NavigationDebug = NavigationDebug
  console.log('🧪 NavigationDebug carregado. Use NavigationDebug.testNavigation() para testar.')
}