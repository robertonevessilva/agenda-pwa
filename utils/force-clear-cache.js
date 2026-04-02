// Script para forçar limpeza de cache do PWA e atualização do service worker
// Execute este script no console do navegador para limpar caches antigos

console.log('🔧 Iniciando limpeza de cache do PWA...');

// Função para limpar todos os caches
async function clearAllCaches() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`📦 Caches encontrados: ${cacheNames.length}`);
      
      for (const cacheName of cacheNames) {
        console.log(`🗑️  Removendo cache: ${cacheName}`);
        await caches.delete(cacheName);
      }
      
      console.log('✅ Todos os caches foram removidos');
    } else {
      console.log('ℹ️  API Cache não suportada neste navegador');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar caches:', error);
  }
}

// Função para forçar atualização do service worker
async function forceServiceWorkerUpdate() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🔄 Service Workers registrados: ${registrations.length}`);
      
      for (const registration of registrations) {
        console.log(`🔄 Atualizando service worker: ${registration.scope}`);
        
        // Forçar atualização
        await registration.update();
        
        // Limpar caches do service worker
        if (registration.active) {
          registration.active.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Desregistrar e registrar novamente
        await registration.unregister();
        console.log(`✅ Service worker desregistrado: ${registration.scope}`);
      }
      
      // Registrar novo service worker
      await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Novo service worker registrado');
    } else {
      console.log('ℹ️  Service Workers não suportados neste navegador');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar service worker:', error);
  }
}

// Função para limpar localStorage e sessionStorage
function clearLocalStorage() {
  try {
    const agendaKeys = Object.keys(localStorage).filter(key => 
      key.includes('agenda') || key.includes('pwa') || key.includes('nuxt')
    );
    
    console.log(`🗑️  Chaves do localStorage relacionadas ao app: ${agendaKeys.length}`);
    
    for (const key of agendaKeys) {
      localStorage.removeItem(key);
      console.log(`🗑️  Removido: ${key}`);
    }
    
    sessionStorage.clear();
    console.log('✅ localStorage e sessionStorage limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar localStorage:', error);
  }
}

// Função para recarregar a página com parâmetros de cache busting
function reloadWithCacheBusting() {
  console.log('🔄 Recarregando página com cache busting...');
  
  // Adicionar timestamp para evitar cache
  const timestamp = new Date().getTime();
  const url = new URL(window.location.href);
  url.searchParams.set('_t', timestamp);
  
  // Redirecionar
  window.location.href = url.toString();
}

// Função principal
async function forceClearCacheAndUpdate() {
  console.log('🚀 Iniciando limpeza completa de cache e atualização...');
  
  // 1. Limpar caches
  await clearAllCaches();
  
  // 2. Forçar atualização do service worker
  await forceServiceWorkerUpdate();
  
  // 3. Limpar localStorage
  clearLocalStorage();
  
  // 4. Recarregar página
  setTimeout(() => {
    reloadWithCacheBusting();
  }, 1000);
}

// Executar automaticamente se estiver em modo de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🛠️  Modo de desenvolvimento detectado');
  // Em desenvolvimento, apenas mostrar as funções disponíveis
  window.forceClearCache = forceClearCacheAndUpdate;
  window.clearAllCaches = clearAllCaches;
  window.forceServiceWorkerUpdate = forceServiceWorkerUpdate;
  window.clearLocalStorage = clearLocalStorage;
  
  console.log('📋 Funções disponíveis no console:');
  console.log('  - forceClearCache() - Limpeza completa');
  console.log('  - clearAllCaches() - Limpar apenas caches');
  console.log('  - forceServiceWorkerUpdate() - Atualizar service worker');
  console.log('  - clearLocalStorage() - Limpar localStorage');
} else {
  console.log('🌐 Modo de produção detectado');
  // Em produção, executar automaticamente
  forceClearCacheAndUpdate();
}

console.log('✅ Script de limpeza de cache carregado');
console.log('💡 Execute forceClearCache() no console para limpar caches manualmente');