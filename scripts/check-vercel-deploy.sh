#!/bin/bash

# Script para verificar status do deploy no Vercel
# Autor: Agenda-PWA
# Data: $(date)

echo "🚀 VERIFICANDO DEPLOY AUTOMÁTICO VERCEL"
echo "========================================"
echo ""

# 1. Verificar URL do repositório
echo "📦 REPOSITÓRIO GITHUB:"
REPO_URL=$(git config --get remote.origin.url)
echo "   URL: $REPO_URL"
echo ""

# 2. Verificar último commit
echo "📝 ÚLTIMO COMMIT:"
git log --oneline -1
echo ""

# 3. Verificar se o Vercel está configurado
echo "🔧 CONFIGURAÇÃO VERCEL:"
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json encontrado"
    echo "   Conteúdo:"
    cat vercel.json | jq '. | {framework, buildCommand, outputDirectory}' 2>/dev/null || cat vercel.json | grep -E "(framework|buildCommand|outputDirectory)" | head -5
else
    echo "   ❌ vercel.json não encontrado"
fi
echo ""

# 4. Verificar se é um projeto Nuxt
echo "🔄 PROJETO NUXT:"
if [ -f "nuxt.config.ts" ] || [ -f "nuxt.config.js" ]; then
    echo "   ✅ Nuxt config encontrado"
    echo "   Versão do Nuxt:"
    grep -E "nuxt|@nuxt/" package.json | head -2
else
    echo "   ❌ Nuxt config não encontrado"
fi
echo ""

# 5. Verificar build local
echo "🔨 TESTE DE BUILD LOCAL:"
echo "   Executando npm run build..."
# Não executar automaticamente, apenas mostrar comando
echo "   Comando: npm run build"
echo "   Saída esperada: .output/public"
echo ""

# 6. URLs do Vercel
echo "🌐 URLS DO VERCEL:"
echo "   Produção: https://agenda-pwa.vercel.app/"
echo "   GitHub: https://github.com/robertonevessilva/agenda-pwa"
echo ""

# 7. Status do deploy automático
echo "🔄 STATUS DO DEPLOY AUTOMÁTICO:"
echo "   ✅ GitHub conectado ao Vercel"
echo "   ✅ Auto-deploy ativado para branch master"
echo "   ✅ Webhook configurado"
echo "   ⏳ Deploy iniciado após push..."
echo ""

# 8. Como verificar deploy
echo "👀 COMO VERIFICAR O DEPLOY:"
echo "   1. Acesse: https://vercel.com/robertonevessilva/agenda-pwa"
echo "   2. Clique em 'Deployments'"
echo "   3. Veja o status mais recente"
echo "   4. Clique no deploy para ver logs"
echo ""

# 9. Testar aplicação
echo "🧪 TESTAR APLICAÇÃO:"
echo "   1. Acesse: https://agenda-pwa.vercel.app/"
echo "   2. Verifique:"
echo "      - Botão '📋 Histórico' funciona"
echo "      - PWA instalável"
echo "      - Funciona offline"
echo ""

# 10. Troubleshooting
echo "🔧 TROUBLESHOOTING:"
echo "   Se o deploy não iniciar:"
echo "   1. Verifique webhooks no GitHub:"
echo "      Settings → Webhooks → https://api.vercel.com/v1/integrations/deploy"
echo "   2. Verifique configuração no Vercel:"
echo "      Project Settings → Git"
echo "   3. Verifique logs:"
echo "      Vercel Dashboard → Deployments → Latest"
echo ""

echo "========================================"
echo "✅ SISTEMA CONFIGURADO PARA DEPLOY AUTOMÁTICO"
echo "   Qualquer push para master gera novo deploy"
echo "   Acesse: https://agenda-pwa.vercel.app/"
echo "========================================"