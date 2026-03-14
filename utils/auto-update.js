// Sistema de Atualização Automática para Agenda-PWA
// Detecta novas versões e limpa cache automaticamente

export const AutoUpdateManager = {
  // Configurações
  config: {
    checkInterval: 30 * 60 * 1000, // Verificar a cada 30 minutos
    versionKey: 'agenda-pwa-version',
    cacheKey: 'agenda-pwa-cache-version',
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Estado atual
  state: {
    currentVersion: null,
    newVersionAvailable: false,
    updateInProgress: false,
    lastCheck: null
  },
  
  // Inicializar o sistema de atualização
  async initialize() {
    if (!this._isServiceWorkerSupported()) {
      this._log('Service Worker não suportado neste navegador');
      return;
    }
    
    this._log('Inicializando sistema de atualização automática...');
    
    // Carregar versão atual
    await this._loadCurrentVersion();
    
    // Registrar listeners para eventos do Service Worker
    this._registerServiceWorkerListeners();
    
    // Verificar atualizações imediatamente
    await this.checkForUpdates();
    
    // Configurar verificação periódica
    this._setupPeriodicChecking();
    
    // Monitorar conexão para verificar quando online
    this._setupConnectionMonitoring();
    
    this._log('Sistema de atualização inicializado');
    this._log(`Versão atual: ${this.state.currentVersion}`);
  },
  
  // Verificar se há atualizações disponíveis
  async checkForUpdates(force = false) {
    if (this.state.updateInProgress && !force) {
      this._log('Atualização já em progresso, ignorando...');
      return;
    }
    
    this.state.updateInProgress = true;
    this.state.lastCheck = new Date();
    
    try {
      this._log('Verificando atualizações...');
      
      if (!navigator.serviceWorker.controller) {
        this._log('Service Worker não está controlando a página');
        return;
      }
      
      // 1. Verificar se Service Worker tem nova versão
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        this._log('Nenhum Service Worker registrado');
        return;
      }
      
      // 2. Solicitar atualização ao Service Worker
      await registration.update();
      this._log('Verificação de atualização solicitada ao Service Worker');
      
      // 3. Verificar se há nova versão no servidor
      const serverVersion = await this._fetchServerVersion();
      if (serverVersion && serverVersion !== this.state.currentVersion) {
        this._log(`Nova versão disponível: ${serverVersion} (atual: ${this.state.currentVersion})`);
        this.state.newVersionAvailable = true;
        
        // Notificar usuário
        this._showUpdateNotification(serverVersion);
        
        // Limpar cache automaticamente se for nova versão
        await this._clearCacheForNewVersion(serverVersion);
      } else {
        this._log('Nenhuma nova versão disponível');
        this.state.newVersionAvailable = false;
      }
      
    } catch (error) {
      this._log(`Erro ao verificar atualizações: ${error.message}`, 'error');
    } finally {
      this.state.updateInProgress = false;
    }
  },
  
  // Forçar atualização imediata
  async forceUpdate() {
    this._log('Forçando atualização imediata...');
    
    try {
      // 1. Limpar todos os caches do Agenda-PWA
      await this._clearAllAgendaCaches();
      
      // 2. Desregistrar Service Worker atual
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        this._log('Service Worker desregistrado');
      }
      
      // 3. Limpar localStorage de versão
      localStorage.removeItem(this.config.versionKey);
      localStorage.removeItem(this.config.cacheKey);
      
      // 4. Recarregar página para registrar novo Service Worker
      this._log('Recarregando página para aplicar atualização...');
      
      // Mostrar mensagem para usuário
      this._showReloadNotification();
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload(true);
      }, 2000);
      
    } catch (error) {
      this._log(`Erro ao forçar atualização: ${error.message}`, 'error');
    }
  },
  
  // Limpar cache apenas do Agenda-PWA
  async clearCache() {
    this._log('Limpando cache do Agenda-PWA...');
    
    try {
      await this._clearAllAgendaCaches();
      this._showNotification('Cache limpo com sucesso!', 'success');
    } catch (error) {
      this._log(`Erro ao limpar cache: ${error.message}`, 'error');
      this._showNotification('Erro ao limpar cache', 'error');
    }
  },
  
  // Métodos privados
  async _loadCurrentVersion() {
    // Tentar obter versão do localStorage
    const savedVersion = localStorage.getItem(this.config.versionKey);
    
    if (savedVersion) {
      this.state.currentVersion = savedVersion;
    } else {
      // Se não houver versão salva, usar timestamp atual
      this.state.currentVersion = `v1.0.0-${Date.now()}`;
      localStorage.setItem(this.config.versionKey, this.state.currentVersion);
    }
    
    this._log(`Versão carregada: ${this.state.currentVersion}`);
  },
  
  async _fetchServerVersion() {
    try {
      // Em produção, faria uma requisição para um endpoint de versão
      // Por enquanto, retorna null (será implementado no deploy)
      
      // Para desenvolvimento, usa timestamp do build
      if (this.config.debug) {
        const response = await fetch('/api/version', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          return data.version;
        }
      }
      
      return null;
    } catch (error) {
      this._log(`Erro ao buscar versão do servidor: ${error.message}`);
      return null;
    }
  },
  
  async _clearCacheForNewVersion(newVersion) {
    const cacheVersion = localStorage.getItem(this.config.cacheKey);
    
    // Se for uma versão diferente da cacheada, limpar cache
    if (!cacheVersion || cacheVersion !== newVersion) {
      this._log(`Nova versão detectada, limpando cache...`);
      
      try {
        await this._clearAllAgendaCaches();
        localStorage.setItem(this.config.cacheKey, newVersion);
        this._log('Cache limpo para nova versão');
        
        // Notificar usuário para recarregar
        this._showNewVersionNotification(newVersion);
      } catch (error) {
        this._log(`Erro ao limpar cache para nova versão: ${error.message}`, 'error');
      }
    }
  },
  
  async _clearAllAgendaCaches() {
    if (!('caches' in window)) {
      this._log('Cache API não disponível');
      return;
    }
    
    try {
      const cacheKeys = await caches.keys();
      const agendaCaches = cacheKeys.filter(key => key.includes('agenda-'));
      
      this._log(`Encontrados ${agendaCaches.length} caches do Agenda-PWA`);
      
      for (const cacheKey of agendaCaches) {
        await caches.delete(cacheKey);
        this._log(`   Cache removido: ${cacheKey}`);
      }
      
      // Também limpar caches do Workbox com prefixo workbox
      const workboxCaches = cacheKeys.filter(key => key.startsWith('workbox-'));
      for (const cacheKey of workboxCaches) {
        await caches.delete(cacheKey);
        this._log(`   Cache Workbox removido: ${cacheKey}`);
      }
      
      this._log('Todos os caches do Agenda-PWA limpos');
    } catch (error) {
      throw new Error(`Falha ao limpar caches: ${error.message}`);
    }
  },
  
  _registerServiceWorkerListeners() {
    if (!navigator.serviceWorker) return;
    
    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this._log(`Mensagem do Service Worker: ${event.data.type}`);
      
      switch (event.data.type) {
        case 'UPDATE_AVAILABLE':
          this._handleUpdateAvailable(event.data);
          break;
          
        case 'RELOAD_PAGE':
          this._handleReloadRequest(event.data);
          break;
      }
    });
    
    // Listener para mudanças de estado do Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this._log('Service Worker controller mudou - nova versão ativada');
      this._showNotification('Nova versão carregada! Recarregando...', 'info');
      
      // Recarregar após breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  },
  
  _setupPeriodicChecking() {
    // Verificar a cada X minutos
    setInterval(() => {
      if (navigator.onLine) {
        this.checkForUpdates();
      }
    }, this.config.checkInterval);
    
    this._log(`Verificação periódica configurada: ${this.config.checkInterval / 60000} minutos`);
  },
  
  _setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this._log('Conexão restaurada, verificando atualizações...');
      this.checkForUpdates();
    });
    
    window.addEventListener('offline', () => {
      this._log('Conexão perdida');
    });
  },
  
  _handleUpdateAvailable(data) {
    this._log(`Nova versão disponível: ${data.version}`);
    this.state.newVersionAvailable = true;
    
    // Mostrar notificação para usuário
    this._showUpdateNotification(data.version, data.message);
  },
  
  _handleReloadRequest(data) {
    this._log(`Solicitação de recarga: ${data.reason}`);
    
    if (data.reason === 'cache_cleared') {
      this._showNotification('Cache atualizado! Recarregando...', 'info');
      
      // Recarregar após breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  },
  
  _showUpdateNotification(version, message = 'Nova versão disponível!') {
    if (this.config.debug) {
      console.log(`📢 ${message} (${version})`);
    }
    
    // Criar notificação na interface
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <span class="update-icon">🔄</span>
        <span class="update-message">${message}</span>
        <div class="update-actions">
          <button class="update-btn update-now" onclick="AutoUpdateManager.forceUpdate()">
            Atualizar Agora
          </button>
          <button class="update-btn update-later" onclick="this.parentElement.parentElement.parentElement.remove()">
            Depois
          </button>
        </div>
      </div>
    `;
    
    // Estilos inline
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1976d2, #2196f3);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    const content = notification.querySelector('.update-notification-content');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    
    const actions = notification.querySelector('.update-actions');
    actions.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 8px;
    `;
    
    const buttons = notification.querySelectorAll('.update-btn');
    buttons.forEach(btn => {
      btn.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        flex: 1;
      `;
    });
    
    const updateNow = notification.querySelector('.update-now');
    updateNow.style.cssText += `
      background: #4caf50;
      color: white;
    `;
    
    const updateLater = notification.querySelector('.update-later');
    updateLater.style.cssText += `
      background: rgba(255,255,255,0.2);
      color: white;
    `;
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Auto-remover após 30 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 30000);
  },
  
  _showNewVersionNotification(version) {
    this._showNotification(`Versão ${version} disponível! Recarregando...`, 'info');
    
    // Auto-reload após 3 segundos
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  },
  
  _showReloadNotification() {
    this._showNotification('Aplicando atualização...', 'info');
  },
  
  _showNotification(message, type = 'info') {
    if (this.config.debug) {
      const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
      console.log(`${icon} ${message}`);
    }
    
    // Implementação básica - pode ser extendida com UI framework
    alert(`Agenda-PWA: ${message}`);
  },
  
  _isServiceWorkerSupported() {
    return 'serviceWorker' in navigator && 'caches' in window;
  },
  
  _log(message, level = 'info') {
    if (!this.config.debug && level === 'info') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} AutoUpdate: ${message}`);
  }
};

// Inicializar automaticamente quando a página carregar
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      AutoUpdateManager.initialize().catch(error => {
        console.error('Erro ao inicializar AutoUpdateManager:', error);
      });
    }, 2000); // Delay para não interferir com carregamento inicial
  });
  
  // Exportar para uso global
  window.AutoUpdateManager = AutoUpdateManager;
}

// Estilos CSS para as notificações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .update-notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .update-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    transition: all 0.2s;
  }
  
  .update-btn:active {
    transform: translateY(0);
  }
`;

document.head.appendChild(style);

export default AutoUpdateManager;