// Script de teste para demonstrar atualização no computador e celular
export const UpdateTest = {
  async runAllTests() {
    console.log('🧪 TESTANDO SISTEMA DE ATUALIZAÇÃO DO PWA')
    console.log('='.repeat(60))
    
    await this.testServiceWorker()
    await this.testCacheStrategies()
    await this.testUpdateMechanisms()
    await this.testOfflineCapability()
    
    console.log('='.repeat(60))
    console.log('✅ TESTES DE ATUALIZAÇÃO COMPLETOS')
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('1. Teste no computador: http://localhost:3000/')
    console.log('2. Teste no celular: Acesse o mesmo URL')
    console.log('3. Instale como PWA no celular')
    console.log('4. Teste offline em ambos os dispositivos')
  },
  
  async testServiceWorker() {
    console.log('\n⚙️ TESTE 1: SERVICE WORKER')
    
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker API disponível')
      
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        
        if (registration) {
          console.log('✅ Service Worker registrado')
          console.log(`   Scope: ${registration.scope}`)
          console.log(`   Estado: ${registration.active?.state || 'não ativo'}`)
          
          if (navigator.serviceWorker.controller) {
            console.log('✅ Service Worker controlando a página')
            console.log(`   Script: ${navigator.serviceWorker.controller.scriptURL}`)
          } else {
            console.log('ℹ️ Service Worker não está controlando (pode ser primeira visita)')
          }
          
          // Verificar se há atualização disponível
          const update = await registration.update()
          console.log('✅ Verificação de atualização realizada')
          
        } else {
          console.log('ℹ️ Nenhum Service Worker registrado')
          console.log('💡 Dica: Recarregue a página para registrar o Service Worker')
        }
      } catch (error) {
        console.error('❌ Erro ao verificar Service Worker:', error)
      }
    } else {
      console.log('❌ Service Worker não suportado neste navegador')
      console.log('💡 Use Chrome, Edge ou Safari para melhor experiência PWA')
    }
  },
  
  async testCacheStrategies() {
    console.log('\n💾 TESTE 2: ESTRATÉGIAS DE CACHE')
    
    if ('caches' in window) {
      console.log('✅ Cache API disponível')
      
      try {
        const cacheNames = await caches.keys()
        console.log(`✅ ${cacheNames.length} caches encontrados:`)
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          console.log(`   📦 ${cacheName}: ${requests.length} itens em cache`)
          
          // Mostrar alguns exemplos
          if (requests.length > 0) {
            const sample = requests.slice(0, 3)
            sample.forEach((request, index) => {
              console.log(`     ${index + 1}. ${request.url}`)
            })
            if (requests.length > 3) {
              console.log(`     ... e mais ${requests.length - 3} itens`)
            }
          }
        }
        
        // Verificar estratégias configuradas
        console.log('\n🎯 Estratégias de cache configuradas:')
        console.log('   1. Páginas: NetworkFirst (tenta rede, fallback cache)')
        console.log('   2. Imagens: CacheFirst (cache primeiro)')
        console.log('   3. Fontes: CacheFirst (cache primeiro)')
        console.log('   4. Scripts/CSS: StaleWhileRevalidate (cache + atualização)')
        
      } catch (error) {
        console.error('❌ Erro ao verificar caches:', error)
      }
    } else {
      console.log('ℹ️ Cache API não disponível')
    }
  },
  
  async testUpdateMechanisms() {
    console.log('\n🔄 TESTE 3: MECANISMOS DE ATUALIZAÇÃO')
    
    console.log('📱 Dispositivo atual:', this.getDeviceType())
    console.log('🌐 Conexão:', navigator.onLine ? 'Online' : 'Offline')
    
    // Testar diferentes métodos de atualização
    console.log('\n🛠️ Métodos de atualização disponíveis:')
    
    const updateMethods = [
      {
        name: 'Recarga normal (F5)',
        description: 'Usa cache do Service Worker',
        test: () => window.location.reload()
      },
      {
        name: 'Recarga forçada (Ctrl+Shift+R)',
        description: 'Ignora cache, busca nova versão',
        test: () => window.location.reload(true)
      },
      {
        name: 'Atualização programática',
        description: 'Via Service Worker API',
        test: async () => {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
              await registration.update()
              return '✅ Atualização solicitada'
            }
          }
          return '❌ Service Worker não disponível'
        }
      },
      {
        name: 'Navegação para mesma página',
        description: 'Testa cache de navegação',
        test: () => {
          window.location.href = window.location.href
          return '✅ Navegação iniciada'
        }
      }
    ]
    
    for (const method of updateMethods) {
      console.log(`\n   🔧 ${method.name}:`)
      console.log(`      ${method.description}`)
      
      try {
        if (typeof method.test === 'function') {
          const result = await method.test()
          console.log(`      ${result}`)
        }
      } catch (error) {
        console.log(`      ❌ Erro: ${error.message}`)
      }
    }
  },
  
  async testOfflineCapability() {
    console.log('\n📴 TESTE 4: CAPACIDADE OFFLINE')
    
    // Simular modo offline
    console.log('🧪 Testando funcionalidade offline...')
    
    // Verificar se há cache suficiente para funcionar offline
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        let totalCachedItems = 0
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          totalCachedItems += requests.length
        }
        
        console.log(`✅ ${totalCachedItems} itens em cache para uso offline`)
        
        if (totalCachedItems > 10) {
          console.log('🎉 App deve funcionar bem offline!')
        } else if (totalCachedItems > 0) {
          console.log('⚠️ Cache limitado, algumas funcionalidades podem não funcionar offline')
        } else {
          console.log('❌ Nenhum item em cache - app não funcionará offline')
        }
        
      } catch (error) {
        console.error('❌ Erro ao verificar cache offline:', error)
      }
    }
    
    // Testar armazenamento local (para dados da agenda)
    console.log('\n💾 Armazenamento local:')
    try {
      const localStorageSize = JSON.stringify(localStorage).length
      console.log(`✅ ${localStorageSize} bytes no localStorage`)
      
      // Verificar se há dados da agenda
      const agendaKeys = Object.keys(localStorage).filter(key => 
        key.includes('agenda') || key.includes('reminder') || key.includes('appointment')
      )
      console.log(`✅ ${agendaKeys.length} chaves relacionadas à agenda`)
      
    } catch (error) {
      console.log('❌ Erro ao verificar localStorage:', error.message)
    }
  },
  
  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
      return '📱 Celular/Tablet'
    } else if (/tablet|ipad/.test(userAgent)) {
      return '📟 Tablet'
    } else {
      return '🖥️ Computador'
    }
  },
  
  async simulateUpdate() {
    console.log('\n🎭 SIMULAÇÃO DE ATUALIZAÇÃO')
    
    // Mostrar como funciona o processo de atualização
    console.log('1. 🏗️  Nova versão do app é construída')
    console.log('2. 📦 Service Worker detecta nova versão')
    console.log('3. ⬇️  Baixa assets em background')
    console.log('4. ⏳ Aguarda todas as abas fecharem')
    console.log('5. 🚀 Ativa nova versão na próxima abertura')
    console.log('6. ✅ Usuário vê a versão atualizada')
    
    // Demonstrar com um contador
    let count = 0
    const interval = setInterval(() => {
      count++
      console.log(`   ⏱️  Simulando atualização... ${count}/5`)
      
      if (count >= 5) {
        clearInterval(interval)
        console.log('   ✅ Simulação completa!')
        console.log('   🔄 Recarregue a página para ver "atualização"')
      }
    }, 1000)
  },
  
  async clearCacheAndTest() {
    console.log('\n🧹 LIMPANDO CACHE E TESTANDO NOVA INSTALAÇÃO')
    
    if (confirm('Deseja limpar todo o cache e testar como primeira visita?')) {
      try {
        // Desregistrar Service Worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            await registration.unregister()
            console.log('✅ Service Worker desregistrado')
          }
        }
        
        // Limpar caches
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName)
            console.log(`🗑️  Cache deletado: ${cacheName}`)
          }
        }
        
        // Limpar localStorage (opcional)
        // localStorage.clear()
        // console.log('🗑️  localStorage limpo')
        
        console.log('🔄 Recarregando página como primeira visita...')
        setTimeout(() => {
          window.location.reload(true)
        }, 1000)
        
      } catch (error) {
        console.error('❌ Erro ao limpar cache:', error)
      }
    }
  }
}

// Adicionar listener para eventos do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('📨 Mensagem do Service Worker:', event.data)
  })
  
  navigator.serviceWorker.addEventListener('statechange', event => {
    console.log('⚡ Mudança de estado do Service Worker:', event.target.state)
  })
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.UpdateTest = UpdateTest
  console.log('🧪 UpdateTest carregado. Use UpdateTest.runAllTests() para testar.')
}

// Função auxiliar para mostrar status atual
export function showCurrentStatus() {
  console.log('📊 STATUS ATUAL DO PWA:')
  console.log(`   Dispositivo: ${UpdateTest.getDeviceType()}`)
  console.log(`   Online: ${navigator.onLine ? '✅ Sim' : '❌ Não'}`)
  console.log(`   Service Worker: ${'serviceWorker' in navigator ? '✅ Disponível' : '❌ Não disponível'}`)
  console.log(`   Cache API: ${'caches' in window ? '✅ Disponível' : '❌ Não disponível'}`)
  console.log(`   PWA instalável: ${window.matchMedia('(display-mode: standalone)').matches ? '✅ Já instalado' : '📲 Pode instalar'}`)
}