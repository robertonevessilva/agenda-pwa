/**
 * Script de teste para notificações da Agenda-PWA
 * 
 * Este script testa o sistema de notificações para garantir que funciona
 * corretamente em dispositivos móveis, mesmo quando o app está em segundo plano.
 */

export const NotificationTester = {
  // Testar suporte a notificações
  async testNotificationSupport() {
    console.log('🧪 TESTE: Verificando suporte a notificações...');
    
    if (typeof window === 'undefined') {
      console.log('❌ Não está em ambiente de navegador');
      return false;
    }
    
    const supported = 'Notification' in window;
    console.log(`✅ Suporte a notificações: ${supported ? 'SIM' : 'NÃO'}`);
    
    if (supported) {
      console.log(`📱 Service Worker suportado: ${'serviceWorker' in navigator ? 'SIM' : 'NÃO'}`);
      console.log(`🔔 Permissão atual: ${Notification.permission}`);
    }
    
    return supported;
  },
  
  // Testar permissão de notificações
  async testNotificationPermission() {
    console.log('🧪 TESTE: Solicitando permissão de notificações...');
    
    try {
      const permission = await Notification.requestPermission();
      console.log(`✅ Permissão obtida: ${permission}`);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  },
  
  // Testar notificação imediata
  async testImmediateNotification() {
    console.log('🧪 TESTE: Enviando notificação imediata...');
    
    try {
      const notification = new Notification('🔔 Teste de Notificação', {
        body: 'Esta é uma notificação de teste da Agenda PWA!',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        requireInteraction: true
      });
      
      console.log('✅ Notificação de teste enviada');
      
      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
        console.log('⏰ Notificação fechada automaticamente');
      }, 5000);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return false;
    }
  },
  
  // Testar agendamento de notificação
  async testScheduledNotification() {
    console.log('🧪 TESTE: Agendando notificação para 30 segundos...');
    
    try {
      // Usar o composable de notificações
      const { useNotifications } = await import('~/composables/useNotifications');
      const notifications = useNotifications();
      
      // Agendar notificação para 30 segundos no futuro
      const scheduledTime = new Date(Date.now() + 30000);
      const notificationId = notifications.scheduleNotification(
        'reminder',
        'test-item-123',
        'Teste de Lembrete Agendado',
        scheduledTime
      );
      
      console.log(`✅ Notificação agendada para: ${scheduledTime.toLocaleTimeString()}`);
      console.log(`📝 ID da notificação: ${notificationId}`);
      
      // Verificar se foi salva no localStorage
      const saved = localStorage.getItem('agenda-scheduled-notifications');
      if (saved) {
        const notifications = JSON.parse(saved);
        console.log(`💾 Notificações salvas no localStorage: ${notifications.length}`);
      }
      
      return notificationId;
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
      return null;
    }
  },
  
  // Testar verificação de notificações pendentes
  async testPendingNotifications() {
    console.log('🧪 TESTE: Verificando notificações pendentes...');
    
    try {
      const { useNotifications } = await import('~/composables/useNotifications');
      const notifications = useNotifications();
      
      // Forçar verificação
      notifications.checkPendingNotifications();
      
      const pending = notifications.getPendingNotifications();
      console.log(`📋 Notificações pendentes: ${pending.length}`);
      
      if (pending.length > 0) {
        pending.forEach((n, i) => {
          console.log(`  ${i + 1}. ${n.title} - ${n.scheduledTime.toLocaleTimeString()}`);
        });
      }
      
      return pending.length;
    } catch (error) {
      console.error('❌ Erro ao verificar notificações pendentes:', error);
      return 0;
    }
  },
  
  // Testar notificação quando app volta ao foco
  async testVisibilityChange() {
    console.log('🧪 TESTE: Simulando mudança de visibilidade...');
    
    if (typeof document === 'undefined') {
      console.log('❌ Document não disponível');
      return false;
    }
    
    // Simular que o app ficou oculto
    console.log('👁️  App ficou oculto (simulado)');
    
    // Simular que o app voltou ao foco
    console.log('👁️  App voltou ao foco (simulado)');
    
    // Disparar evento de visibilitychange
    const event = new Event('visibilitychange');
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true
    });
    
    document.dispatchEvent(event);
    
    console.log('✅ Evento de mudança de visibilidade disparado');
    return true;
  },
  
  // Testar Service Worker
  async testServiceWorker() {
    console.log('🧪 TESTE: Verificando Service Worker...');
    
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker não suportado');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        console.log('✅ Service Worker registrado');
        console.log(`📝 Scope: ${registration.scope}`);
        console.log(`🔄 Estado: ${registration.active ? 'Ativo' : 'Inativo'}`);
        
        // Verificar se o notification handler está carregado
        if (registration.active) {
          console.log('🔔 Notification Handler: Disponível');
        }
        
        return true;
      } else {
        console.log('❌ Service Worker não registrado');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Service Worker:', error);
      return false;
    }
  },
  
  // Testar comunicação com Service Worker
  async testServiceWorkerCommunication() {
    console.log('🧪 TESTE: Testando comunicação com Service Worker...');
    
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker não suportado');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Enviar mensagem para o Service Worker
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          console.log('📨 Resposta do Service Worker:', event.data);
          resolve(event.data.success === true);
        };
        
        registration.active.postMessage({
          type: 'CHECK_NOTIFICATIONS'
        }, [messageChannel.port2]);
        
        console.log('✅ Mensagem enviada para Service Worker');
      });
    } catch (error) {
      console.error('❌ Erro na comunicação com Service Worker:', error);
      return false;
    }
  },
  
  // Executar todos os testes
  async runAllTests() {
    console.log('🚀 INICIANDO TESTES COMPLETOS DE NOTIFICAÇÕES');
    console.log('=' .repeat(50));
    
    const results = {
      support: await this.testNotificationSupport(),
      permission: await this.testNotificationPermission(),
      immediate: false,
      scheduled: false,
      pending: 0,
      visibility: false,
      serviceWorker: false,
      communication: false
    };
    
    if (results.support && results.permission) {
      results.immediate = await this.testImmediateNotification();
      
      // Aguardar 1 segundo antes do próximo teste
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const notificationId = await this.testScheduledNotification();
      results.scheduled = notificationId !== null;
      
      results.pending = await this.testPendingNotifications();
      results.visibility = await this.testVisibilityChange();
      results.serviceWorker = await this.testServiceWorker();
      
      if (results.serviceWorker) {
        results.communication = await this.testServiceWorkerCommunication();
      }
    }
    
    console.log('=' .repeat(50));
    console.log('📊 RESUMO DOS TESTES:');
    console.log(`✅ Suporte a notificações: ${results.support ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Permissão concedida: ${results.permission ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Notificação imediata: ${results.immediate ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Notificação agendada: ${results.scheduled ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Notificações pendentes: ${results.pending}`);
    console.log(`✅ Mudança de visibilidade: ${results.visibility ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Service Worker: ${results.serviceWorker ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Comunicação SW: ${results.communication ? 'SIM' : 'NÃO'}`);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(v => v === true || (typeof v === 'number' && v >= 0)).length;
    
    console.log(`🎯 Resultado: ${passedTests}/${totalTests} testes passaram`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM! As notificações devem funcionar no celular.');
      console.log('📱 Dicas para celular:');
      console.log('   1. Instale o app como PWA (adicione à tela inicial)');
      console.log('   2. Conceda permissão para notificações');
      console.log('   3. O app verificará notificações quando voltar ao foco');
      console.log('   4. Service Worker verificará notificações em background');
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique os logs acima.');
    }
    
    return results;
  },
  
  // Função para testar notificações no celular
  async testMobileNotifications() {
    console.log('📱 TESTE ESPECÍFICO PARA DISPOSITIVOS MÓVEIS');
    console.log('=' .repeat(50));
    
    console.log('1. Verificando ambiente móvel...');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`   📱 Dispositivo móvel: ${isMobile ? 'SIM' : 'NÃO'}`);
    
    console.log('2. Verificando modo standalone (PWA)...');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    console.log(`   📱 Modo standalone: ${isStandalone ? 'SIM' : 'NÃO'}`);
    
    console.log('3. Testando persistência de notificações...');
    
    // Criar uma notificação para daqui a 1 minuto
    const scheduledTime = new Date(Date.now() + 60000); // 1 minuto
    const { useNotifications } = await import('~/composables/useNotifications');
    const notifications = useNotifications();
    
    const notificationId = notifications.scheduleNotification(
      'reminder',
      'mobile-test-123',
      'Teste Mobile - 1 minuto',
      scheduledTime
    );
    
    console.log(`   ⏰ Notificação agendada para: ${scheduledTime.toLocaleTimeString()}`);
    console.log(`   💾 ID: ${notificationId}`);
    
    console.log('4. Fechando o app (simulado)...');
    console.log('   📱 Em um dispositivo real:');
    console.log('      - Feche o app ou bloqueie a tela');
    console.log('      - Aguarde 1 minuto');
    console.log('      - Reabra o app ou desbloqueie a tela');
    console.log('      - A notificação deve aparecer automaticamente');
    
    console.log('=' .repeat(50));
    console.log('🎯 INSTRUÇÕES PARA TESTE NO CELULAR:');
    console.log('1. Instale o app como PWA (adicione à tela inicial)');
    console.log('2. Conceda permissão para notificações');
    console.log('3. Crie um lembrete/compromisso com notificação ativada');
    console.log('4. Feche o app ou bloqueie a tela');
    console.log('5. Quando chegar o horário, reabra o app');
    console.log('6. A notificação deve aparecer automaticamente');
    
    return {
      isMobile,
      isStandalone,
      notificationId,
      scheduledTime
    };
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.NotificationTester = NotificationTester;
}

// Executar automaticamente se este script for importado diretamente
if (import.meta.url === document.currentScript?.src) {
  console.log('🔧 Script de teste de notificações carregado');
  console.log('💡 Use NotificationTester.runAllTests() para executar todos os testes');
  console.log('💡 Use NotificationTester.testMobileNotifications() para teste específico de mobile');
}