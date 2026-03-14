/**
 * Script para testar configurações PWA
 * Execute no console do navegador para verificar se o PWA está configurado corretamente
 */

const PWATest = {
  async runAllTests() {
    console.log('🔍 Iniciando testes PWA...\n')
    
    const results = {
      manifest: await this.testManifest(),
      serviceWorker: await this.testServiceWorker(),
      https: this.testHTTPS(),
      displayMode: this.testDisplayMode(),
      installability: this.testInstallability(),
      offline: await this.testOfflineCapability()
    }
    
    this.printResults(results)
    return results
  },
  
  async testManifest() {
    console.log('📄 Testando manifest.json...')
    
    try {
      const response = await fetch('/manifest.json')
      if (!response.ok) {
        return { passed: false, message: 'Manifest não encontrado' }
      }
      
      const manifest = await response.json()
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color']
      const missingFields = []
      
      for (const field of requiredFields) {
        if (!manifest[field]) {
          missingFields.push(field)
        }
      }
      
      if (missingFields.length > 0) {
        return { 
          passed: false, 
          message: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
        }
      }
      
      if (manifest.display !== 'standalone' && manifest.display !== 'fullscreen') {
        return { 
          passed: false, 
          message: 'Display deve ser "standalone" ou "fullscreen"' 
        }
      }
      
      return { 
        passed: true, 
        message: 'Manifest configurado corretamente',
        data: {
          name: manifest.name,
          display: manifest.display,
          icons: manifest.icons?.length || 0
        }
      }
    } catch (error) {
      return { passed: false, message: `Erro ao carregar manifest: ${error.message}` }
    }
  },
  
  async testServiceWorker() {
    console.log('⚙️ Testando Service Worker...')
    
    if (!('serviceWorker' in navigator)) {
      return { passed: false, message: 'Service Worker não suportado pelo navegador' }
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      
      if (registrations.length === 0) {
        return { passed: false, message: 'Nenhum Service Worker registrado' }
      }
      
      const sw = registrations[0]
      const scope = sw.scope
      const state = sw.active?.state || 'not active'
      
      return { 
        passed: true, 
        message: 'Service Worker registrado e ativo',
        data: {
          scope,
          state,
          count: registrations.length
        }
      }
    } catch (error) {
      return { passed: false, message: `Erro ao verificar Service Worker: ${error.message}` }
    }
  },
  
  testHTTPS() {
    console.log('🔒 Testando HTTPS...')
    
    const isHTTPS = window.location.protocol === 'https:'
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
    
    if (isHTTPS || isLocalhost) {
      return { 
        passed: true, 
        message: 'Conexão segura (HTTPS ou localhost)',
        data: {
          protocol: window.location.protocol,
          hostname: window.location.hostname
        }
      }
    }
    
    return { 
      passed: false, 
      message: 'HTTPS é necessário para PWA em produção',
      data: {
        protocol: window.location.protocol,
        hostname: window.location.hostname
      }
    }
  },
  
  testDisplayMode() {
    console.log('📱 Testando modo de exibição...')
    
    const displayModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser']
    const currentMode = this.getDisplayMode()
    
    return { 
      passed: displayModes.includes(currentMode),
      message: `Modo de exibição atual: ${currentMode}`,
      data: { currentMode }
    }
  },
  
  getDisplayMode() {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
    return 'browser'
  },
  
  testInstallability() {
    console.log('📲 Testando capacidade de instalação...')
    
    const canInstall = 'BeforeInstallPromptEvent' in window || 
                      window.beforeinstallprompt !== undefined
    
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (navigator.standalone === true)
    
    return { 
      passed: canInstall || isInstalled,
      message: isInstalled ? 'App já instalado' : 
               canInstall ? 'Pode ser instalado' : 'Não pode ser instalado',
      data: {
        canInstall,
        isInstalled,
        beforeInstallPrompt: 'BeforeInstallPromptEvent' in window
      }
    }
  },
  
  async testOfflineCapability() {
    console.log('📶 Testando capacidade offline...')
    
    if (!('serviceWorker' in navigator)) {
      return { passed: false, message: 'Service Worker não suportado' }
    }
    
    try {
      // Testar se o Service Worker responde quando offline
      const cache = await caches.open('pages-cache')
      const cachedResponse = await cache.match(window.location.href)
      
      return { 
        passed: !!cachedResponse,
        message: cachedResponse ? 'Página disponível offline' : 'Página não disponível offline',
        data: {
          hasCache: !!cachedResponse,
          cacheNames: await caches.keys()
        }
      }
    } catch (error) {
      return { 
        passed: false, 
        message: `Erro ao testar offline: ${error.message}` 
      }
    }
  },
  
  printResults(results) {
    console.log('\n📊 RESULTADOS DOS TESTES PWA:\n')
    console.log('='.repeat(50))
    
    let passedCount = 0
    let totalCount = 0
    
    for (const [testName, result] of Object.entries(results)) {
      totalCount++
      if (result.passed) passedCount++
      
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${testName.toUpperCase()}: ${result.message}`)
      
      if (result.data) {
        console.log('   Dados:', result.data)
      }
      
      console.log('')
    }
    
    console.log('='.repeat(50))
    console.log(`📈 ${passedCount}/${totalCount} testes passaram`)
    
    if (passedCount === totalCount) {
      console.log('🎉 PWA configurado corretamente!')
    } else {
      console.log('⚠️  Alguns ajustes são necessários')
    }
  },
  
  // Método para verificar periodicamente o status do Service Worker
  monitorServiceWorker() {
    if (!('serviceWorker' in navigator)) return
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller mudou')
    })
    
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Mensagem do Service Worker:', event.data)
    })
  }
}

// Exportar para uso no console
window.PWATest = PWATest

// Executar automaticamente se estiver no console
if (typeof window !== 'undefined' && window.console) {
  console.log('🛠️  PWATest disponível. Use PWATest.runAllTests() para executar os testes.')
}

export default PWATest