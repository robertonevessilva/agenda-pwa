// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Renderizar apenas no cliente (SPA mode) - necessário para PWA com localStorage
  ssr: false,
  
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  
  // Configuração PWA com CACHE VERSIONADO e ATUALIZAÇÃO AUTOMÁTICA
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Agenda',
      short_name: 'Agenda',
      description: 'Agenda offline para celular',
      theme_color: '#1976d2',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      // Configuração para notificações push com VAPID
      gcm_sender_id: '103953800507', // ID do Google Cloud Messaging
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      // Cache versionado - cada build gera nova versão
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      
      // Runtime caching strategies com versionamento
      runtimeCaching: [
        {
          // Cache para páginas HTML - Network First com versionamento
          urlPattern: /^https?:\/\/.*$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'agenda-pages-v1',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias (mais curto para atualizações)
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
            networkTimeoutSeconds: 2 // Timeout curto para forçar cache se lento
          }
        },
        {
          // Cache para assets estáticos - Cache First com versionamento
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'agenda-images-v1',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
            }
          }
        },
        {
          // Cache para fontes - Cache First com versionamento
          urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'agenda-fonts-v1',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 60 // 60 dias
            }
          }
        },
        {
          // Cache para scripts e estilos - Network First para atualizações rápidas
          urlPattern: /\.(?:js|css)$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'agenda-assets-v1',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 3 // 3 dias (curto para forçar atualização)
            },
            networkTimeoutSeconds: 3
          }
        }
      ],
      
      // Pré-cache de rotas importantes
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api/],
      
      // Limpar TODOS os caches antigos automaticamente quando nova versão disponível
      cleanupOutdatedCaches: true,
      
      // Forçar limpeza de caches com prefixo antigo
      clientsClaim: true,
      skipWaiting: true,
      
      // Configurações adicionais para limpeza agressiva
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      
      // Estratégia de versionamento explícita
      cacheId: 'agenda-pwa-v1', // ID único para este app
      
      // Importar scripts de atualização customizados (compatibilidade)
      importScripts: ['/sw-update-handler.js', '/notification-handler.js']
    },
    
    // Configurações do cliente PWA com notificação de atualização
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 1800, // Verificar a cada 30 minutos
      registerPlugin: true
    },
    
    // Estratégia de desenvolvimento
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: 'module',
      
      // Forçar atualização em desenvolvimento
      navigateFallbackAllowlist: [/^\/$/]
    }
  },
  
  app: {
    head: {
      title: 'Agenda',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Agenda offline para celular' },
        { name: 'theme-color', content: '#1976d2' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
      ]
    }
  },
  
  // Otimizações para mobile
  experimental: {
    payloadExtraction: false
  },
  
  // Configurações de build otimizadas para Vercel
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: []
    },
    // Configuração específica para Vercel
    preset: 'vercel'
  }
})
