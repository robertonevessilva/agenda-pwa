# Configuração PWA - Agenda

Este documento descreve as configurações PWA (Progressive Web App) implementadas no projeto Agenda.

## ✅ Configurações Implementadas

### 1. Manifest.json
- **Localização**: `/public/manifest.json`
- **Campos obrigatórios**:
  - `name`: "Agenda"
  - `short_name`: "Agenda"
  - `start_url`: "/"
  - `display`: "standalone"
  - `theme_color`: "#1976d2"
  - `background_color`: "#ffffff"
- **Ícones**: Inclui ícones em 192x192, 512x512 e máscara para Android
- **Orientação**: portrait (vertical)

### 2. Service Worker (Workbox)
- **Framework**: @vite-pwa/nuxt
- **Estratégias de cache**:
  - **Páginas**: Network First (3s timeout) → Cache
  - **Imagens**: Cache First (1 ano)
  - **Fontes**: Cache First (1 ano)
  - **JS/CSS**: Stale While Revalidate (30 dias)
- **Configurações**:
  - `skipWaiting`: true (ativa novo SW imediatamente)
  - `clientsClaim`: true (assume controle dos clients)
  - `cleanupOutdatedCaches`: true (limpa caches antigos)
  - `navigateFallback`: "/" (fallback para SPA)

### 3. Configuração Nuxt
- **Módulo**: `@vite-pwa/nuxt`
- **Tipo de registro**: `autoUpdate`
- **Client options**: 
  - `installPrompt`: true
  - `periodicSyncForUpdates`: 3600s (1 hora)

### 4. Meta Tags HTML
- **Viewport**: Otimizado para mobile
- **Theme-color**: #1976d2
- **Apple-specific**: 
  - `apple-mobile-web-app-capable`: yes
  - `apple-mobile-web-app-status-bar-style`: black-translucent
- **Android**: `mobile-web-app-capable`: yes

### 5. Instalação PWA
- **Composable**: `usePWAInstall()` em `/composables/usePWAInstall.ts`
- **Componente**: `PWAInstallButton` em `/components/PWAInstallButton.vue`
- **Funcionalidades**:
  - Captura evento `beforeinstallprompt`
  - Botão de instalação personalizado
  - Verificação se app já está instalado
  - Suporte para iOS e Android

## 🧪 Testes PWA

### Script de Teste
Disponível em `/utils/pwa-test.js`. Execute no console do navegador:

```javascript
PWATest.runAllTests()
```

### Testes Realizados:
1. ✅ Manifest.json válido e completo
2. ✅ Service Worker registrado e ativo
3. ✅ HTTPS (ou localhost para desenvolvimento)
4. ✅ Modo de exibição standalone
5. ✅ Capacidade de instalação
6. ✅ Funcionamento offline

## 📱 Requisitos de Instalação

### Para exibir o prompt de instalação:
1. **HTTPS** (exceto localhost)
2. **Manifest válido** com campos obrigatórios
3. **Service Worker registrado**
4. **Ícones** em tamanhos adequados
5. **Visita repetida** (geralmente 2+ visitas)

### Comportamento do Botão de Instalação:
- Aparece apenas quando o navegador emite `beforeinstallprompt`
- Pode ser dispensado pelo usuário (preferência salva em localStorage)
- Não aparece se o app já estiver instalado

## 🔧 Estratégia de Cache

### Evitar Cache Infinito:
- **JS/CSS**: 30 dias máximo (Stale While Revalidate)
- **Páginas**: 30 dias máximo (Network First)
- **Imagens/Fontes**: 1 ano (Cache First, mas com limites de entradas)

### Detecção de Novas Versões:
1. Service Worker registra nova versão
2. `skipWaiting` ativa imediatamente
3. `clientsClaim` assume controle
4. `cleanupOutdatedCaches` remove caches antigos
5. Recarregamento automático na próxima navegação

## 🚀 Deployment

### Para Produção:
1. Certifique-se de usar **HTTPS**
2. Build do projeto: `npm run build`
3. Os arquivos PWA serão gerados automaticamente
4. O Service Worker será registrado na primeira visita

### Verificações Pós-Deploy:
```bash
# Testar manifest
curl https://seusite.com/manifest.json

# Verificar headers de segurança
curl -I https://seusite.com

# Testar offline (no Chrome DevTools)
# 1. Abra Application > Service Workers
# 2. Marque "Offline"
# 3. Recarregue a página
```

## 🐛 Solução de Problemas

### Problema: Botão não aparece
**Soluções**:
1. Verifique console por erros
2. Execute `PWATest.runAllTests()`
3. Verifique se está em HTTPS
4. Aguarde visita repetida (2+)

### Problema: App não funciona offline
**Soluções**:
1. Verifique se Service Worker está registrado
2. Confira estratégias de cache no nuxt.config.ts
3. Teste com o script de testes

### Problema: Ícones não aparecem
**Soluções**:
1. Verifique caminhos dos ícones no manifest
2. Confira se os arquivos existem em `/public/`
3. Use ícones no formato PNG

## 📚 Recursos Úteis

- [Documentação Vite PWA](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)
- [Chrome DevTools PWA](https://developer.chrome.com/docs/devtools/progressive-web-apps/)

---

**Status**: ✅ PWA completamente configurado e funcional
**Última verificação**: $(date)
**Próxima revisão**: Manutenção contínua com updates do @vite-pwa/nuxt