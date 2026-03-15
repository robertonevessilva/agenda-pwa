<template>
  <div v-if="showInstallButton && !isInstalled" class="pwa-install-button">
    <div class="pwa-install-banner">
      <div class="pwa-install-content">
        <div class="pwa-install-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </div>
        <div class="pwa-install-text">
          <h3>📱 Instalar Agenda no Celular</h3>
          <p>Para acesso rápido e uso offline:</p>
          <ul class="pwa-install-features">
            <li>✅ Acesso direto da tela inicial</li>
            <li>✅ Funciona sem internet</li>
            <li>✅ Notificações de lembretes</li>
            <li>✅ Mais rápido que navegador</li>
          </ul>
          <p class="pwa-install-hint">
            <small>Clique em "Instalar" e siga as instruções do seu navegador</small>
          </p>
        </div>
      </div>
      <div class="pwa-install-actions">
        <button @click="install" class="pwa-install-btn">
          📲 Instalar App
        </button>
        <button @click="dismiss" class="pwa-dismiss-btn">
          Agora não
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePWAInstall } from '~/composables/usePWAInstall'

const {
  isInstalled,
  showInstallButton,
  installPWA
} = usePWAInstall()

const install = async () => {
  await installPWA()
}

const dismiss = () => {
  // Armazenar preferência do usuário para não mostrar novamente
  localStorage.setItem('pwa_install_dismissed', 'true')
  showInstallButton.value = false
}

// Verificar se o usuário já dispensou o botão
onMounted(() => {
  const dismissed = localStorage.getItem('pwa_install_dismissed')
  if (dismissed === 'true') {
    showInstallButton.value = false
  }
})
</script>

<style scoped>
.pwa-install-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

.pwa-install-banner {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  border: 1px solid #e0e0e0;
}

.pwa-install-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.pwa-install-icon {
  color: #1976d2;
  flex-shrink: 0;
}

.pwa-install-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.pwa-install-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.pwa-install-features {
  margin: 8px 0 8px 16px;
  padding: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}

.pwa-install-features li {
  margin-bottom: 4px;
}

.pwa-install-hint {
  margin: 8px 0 0 0 !important;
  font-size: 12px !important;
  color: #888 !important;
  font-style: italic;
}

.pwa-install-actions {
  display: flex;
  gap: 8px;
}

.pwa-install-btn {
  flex: 1;
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pwa-install-btn:hover {
  background: #1565c0;
}

.pwa-dismiss-btn {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pwa-dismiss-btn:hover {
  background: #e0e0e0;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .pwa-install-button {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .pwa-install-content {
    flex-direction: column;
    text-align: center;
  }
  
  .pwa-install-icon {
    margin: 0 auto;
  }
}
</style>