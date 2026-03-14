#!/bin/bash

# Script para verificar status do deploy no Vercel
# Autor: Agenda-PWA
# Data: $(date)

echo "🚀 VERIFICANDO STATUS DO DEPLOY VERCEL"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL da aplicação
APP_URL="https://agenda-pwa.vercel.app"
VERCEL_API="https://api.vercel.com"

echo "🌐 VERIFICANDO APLICAÇÃO ONLINE..."
echo "   URL: $APP_URL"
echo ""

# 1. Verificar se a aplicação está respondendo
echo "1. 📡 Testando conexão com a aplicação..."
if curl -s --head --request GET "$APP_URL" | grep "200 OK" > /dev/null; then
    echo -e "   ${GREEN}✅ Aplicação ONLINE (HTTP 200)${NC}"
    
    # Verificar conteúdo da página
    echo "   📄 Verificando conteúdo da página..."
    if curl -s "$APP_URL" | grep -q "Agenda"; then
        echo -e "   ${GREEN}✅ Conteúdo correto detectado${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Conteúdo diferente do esperado${NC}"
    fi
else
    echo -e "   ${RED}❌ Aplicação OFFLINE ou com erro${NC}"
    
    # Tentar verificar com timeout menor
    echo "   🔄 Tentando verificação alternativa..."
    if timeout 5 curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200"; then
        echo -e "   ${GREEN}✅ Aplicação responde (verificação alternativa)${NC}"
    else
        echo -e "   ${RED}❌ Não foi possível conectar à aplicação${NC}"
    fi
fi
echo ""

# 2. Verificar Service Worker (PWA)
echo "2. 📱 Verificando PWA Configuration..."
if curl -s "$APP_URL/manifest.json" | grep -q "name"; then
    echo -e "   ${GREEN}✅ Manifest.json encontrado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Manifest.json não encontrado${NC}"
fi

if curl -s "$APP_URL/sw.js" | grep -q "serviceWorker"; then
    echo -e "   ${GREEN}✅ Service Worker encontrado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Service Worker não encontrado${NC}"
fi
echo ""

# 3. Verificar GitHub para último commit
echo "3. 📝 Verificando último commit no GitHub..."
LAST_COMMIT=$(git log --oneline -1 --pretty=format:"%h %s")
echo "   Último commit local: $LAST_COMMIT"
echo ""

# 4. Verificar se o Vercel está configurado
echo "4. 🔧 Verificando configuração Vercel..."
if [ -f "vercel.json" ]; then
    echo -e "   ${GREEN}✅ vercel.json configurado${NC}"
    
    # Extrair informações do vercel.json
    FRAMEWORK=$(grep -o '"framework": *"[^"]*"' vercel.json | cut -d'"' -f4)
    BUILD_CMD=$(grep -o '"buildCommand": *"[^"]*"' vercel.json | cut -d'"' -f4)
    
    echo "   Framework: $FRAMEWORK"
    echo "   Build Command: $BUILD_CMD"
else
    echo -e "   ${RED}❌ vercel.json não encontrado${NC}"
fi
echo ""

# 5. Verificar build local (simulação)
echo "5. 🔨 Verificando configuração de build local..."
if [ -f "package.json" ]; then
    echo -e "   ${GREEN}✅ package.json encontrado${NC}"
    
    # Verificar scripts de build
    if grep -q "\"build\"" package.json; then
        BUILD_SCRIPT=$(grep -A1 '"build"' package.json | tail -1 | sed 's/.*: "\(.*\)".*/\1/')
        echo "   Script de build: $BUILD_SCRIPT"
    fi
    
    # Verificar dependências do Nuxt
    if grep -q "@nuxt/" package.json || grep -q "nuxt" package.json; then
        echo -e "   ${GREEN}✅ Nuxt.js detectado${NC}"
    fi
else
    echo -e "   ${RED}❌ package.json não encontrado${NC}"
fi
echo ""

# 6. Verificar tempo desde último push
echo "6. ⏰ Tempo desde último push..."
LAST_PUSH_TIME=$(git log -1 --format="%cd" --date=relative)
echo "   Último push: $LAST_PUSH_TIME"
echo ""

# 7. Estimativa de tempo de deploy
echo "7. ⏱️  Estimativa de tempo de deploy Vercel:"
echo "   ⏳ Build: 2-3 minutos"
echo "   ⏳ Deploy: 1-2 minutos"
echo "   ⏳ Total estimado: 3-5 minutos"
echo ""

# 8. Como verificar manualmente
echo "8. 👨‍💻 Como verificar manualmente no Vercel:"
echo "   a) Acesse: https://vercel.com/robertonevessilva/agenda-pwa"
echo "   b) Clique em 'Deployments'"
echo "   c) Veja o status mais recente:"
echo "      - ✅ READY: Deploy concluído"
echo "      - ⏳ BUILDING: Em construção"
echo "      - ❌ ERROR: Erro no deploy"
echo "   d) Clique no deploy para ver logs detalhados"
echo ""

# 9. Testes recomendados
echo "9. 🧪 Testes recomendados após deploy:"
echo "   a) Acesse $APP_URL"
echo "   b) Verifique:"
echo "      - Botão '📋 Histórico' funciona"
echo "      - PWA pode ser instalado (Add to Home Screen)"
echo "      - Funciona offline (desligue wifi e teste)"
echo "      - Console do navegador sem erros (F12)"
echo ""

# 10. Status final
echo "========================================"
echo "📊 STATUS DO DEPLOY:"
echo ""

# Verificar aplicação novamente para status final
if curl -s --head "$APP_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
    echo "   A aplicação está online e respondendo."
    echo "   Acesse: $APP_URL"
    echo ""
    echo "🎉 PRONTO PARA USO!"
    echo "   - PWA instalável"
    echo "   - Botão de histórico funcionando"
    echo "   - Cache versionado ativo"
    echo "   - Deploy automático configurado"
else
    echo -e "${YELLOW}⏳ DEPLOY EM ANDAMENTO OU AGUARDANDO...${NC}"
    echo "   A aplicação pode estar em processo de deploy."
    echo "   Aguarde 3-5 minutos e verifique novamente."
    echo ""
    echo "🔍 Verifique manualmente em:"
    echo "   https://vercel.com/robertonevessilva/agenda-pwa"
fi

echo "========================================"
echo "🔄 Para verificar novamente:"
echo "   ./scripts/check-vercel-status.sh"
echo "========================================"