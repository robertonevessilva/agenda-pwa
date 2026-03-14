// Endpoint de versão para o Agenda-PWA
// Retorna a versão atual do app para verificação de atualizações

export default defineEventHandler(async (event) => {
  // Usar runtime config do Nuxt
  const config = useRuntimeConfig();
  
  // Gerar versão baseada no timestamp atual (simula build timestamp)
  const buildTimestamp = Date.now();
  const appVersion = `v1.0.0-${buildTimestamp}`;
  
  // Informações adicionais sobre o deploy
  const deployInfo = {
    version: appVersion,
    timestamp: new Date().toISOString(),
    environment: config.public.nodeEnv || 'development',
    commitHash: 'local-build', // Em produção, usar variável de ambiente
    buildDate: new Date(buildTimestamp).toISOString(),
    appName: 'Agenda-PWA'
  };
  
  // Headers para evitar cache
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  setHeader(event, 'Pragma', 'no-cache');
  setHeader(event, 'Expires', '0');
  setHeader(event, 'Surrogate-Control', 'no-store');
  
  return {
    success: true,
    data: deployInfo,
    meta: {
      message: 'Versão atual do Agenda-PWA',
      checkForUpdates: true,
      updateAvailable: false, // Será true se houver nova versão no futuro
      cacheStrategy: 'versioned',
      autoUpdate: true
    }
  };
});
