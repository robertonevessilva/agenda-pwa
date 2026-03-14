// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  
  // Configuração PWA com Workbox para cache agressivo
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
      // Cache agressivo - Pre-cache de todos os assets
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      
      // Runtime caching strategies
      runtimeCaching: [
        {
          // Cache para páginas - Network First com fallback para cache
          urlPattern: /^https?:\/\/.*$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
            networkTimeoutSeconds: 3
          }
        },
        {
          // Cache para assets estáticos - Cache First
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
            }
          }
        },
        {
          // Cache para fontes - Cache First
          urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
            }
          }
        },
        {
          // Cache para scripts e estilos - Stale While Revalidate
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
            }
          }
        }
      ],
      
      // Pré-cache de rotas importantes
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api/],
      
      // Limpar caches antigos automaticamente
      cleanupOutdatedCaches: true,
      
      // Ativar o novo SW imediatamente
      skipWaiting: true,
      clientsClaim: true
    },
    
    // Configurações do cliente PWA
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // Verificar atualizações a cada hora
    },
    
    // Estratégia de desenvolvimento
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: 'module'
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
  
  // Configurações de build otimizadas
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  }
})
