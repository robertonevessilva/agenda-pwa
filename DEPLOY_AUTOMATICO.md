# 🚀 Deploy Automático GitHub → Vercel

## 📋 Configuração Atual

### **Vercel Configuration (`vercel.json`)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nuxtjs",
  "regions": ["gru1"],
  "github": {
    "silent": true
  },
  "env": {
    "NODE_VERSION": "22"
  }
}
```

### **GitHub Repository**
- **Repositório:** `agenda-pwa`
- **Branch principal:** `master`
- **Status:** Sincronizado com `origin/master`

## 🔄 Fluxo de Deploy Automático

### **1. GitHub → Vercel (CI/CD)**
```
GitHub Push → Webhook → Vercel → Build → Deploy → Produção
```

### **2. Configurações do Vercel:**
- ✅ **Auto-deploy:** Ativado por padrão
- ✅ **Branch:** `master` (produção)
- ✅ **Framework:** Nuxt.js detectado automaticamente
- ✅ **Região:** `gru1` (São Paulo, Brasil)
- ✅ **Node.js:** Versão 22

### **3. Headers de Segurança Configurados:**
- ✅ **CSP:** Headers de segurança implementados
- ✅ **Service Worker:** Cache control configurado
- ✅ **Assets estáticos:** Cache de 1 ano
- ✅ **Manifest.json:** Cache de 1 hora

## 🛠️ Como Funciona

### **Quando você faz push para o GitHub:**
1. **GitHub** envia webhook para o Vercel
2. **Vercel** detecta mudanças no repositório
3. **Build automático** é iniciado
4. **Deploy** é feito para produção
5. **URL de produção** é atualizada

### **Build Process:**
```bash
npm install
npm run build
# Output: .output/public
```

### **URLs:**
- **Produção:** `https://agenda-pwa.vercel.app/`
- **Preview:** `https://agenda-pwa-git-[branch].vercel.app/`

## 📱 PWA Configurado

### **Service Worker:**
- ✅ **Cache versionado** implementado
- ✅ **Atualização automática** configurada
- ✅ **Funcionamento offline** garantido
- ✅ **Limpeza de cache** apenas do Agenda-PWA

### **Manifest:**
- ✅ **`manifest.json`** configurado
- ✅ **Ícones** para todos os dispositivos
- ✅ **Tema e cores** definidos
- ✅ **Display standalone** para instalação

## 🧪 Testando o Deploy Automático

### **1. Faça uma mudança no código:**
```bash
# Edite qualquer arquivo
# Ex: pages/index.vue, components/*.vue, etc.
```

### **2. Commit e push:**
```bash
git add .
git commit -m "feat: botão de histórico restaurado"
git push origin master
```

### **3. Monitorar deploy:**
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** https://github.com/[usuário]/agenda-pwa/actions
- **Logs de build:** Disponível no Vercel

### **4. Verificar produção:**
- **Acesse:** https://agenda-pwa.vercel.app/
- **Teste:** Botão de histórico, PWA, offline

## 🔧 Configuração Manual (se necessário)

### **1. Conectar GitHub ao Vercel:**
1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Selecione "Import Git Repository"
4. Escolha `agenda-pwa`
5. Configure:
   - **Framework Preset:** Nuxt.js
   - **Root Directory:** `agenda-pwa`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.output/public`
   - **Install Command:** `npm install`

### **2. Configurar Environment Variables:**
```bash
# No Vercel Dashboard:
NODE_ENV=production
NODE_VERSION=22
```

### **3. Configurar Domains (opcional):**
- **Custom domain:** `agenda.seudominio.com`
- **SSL:** Automático (Let's Encrypt)

## 🚨 Troubleshooting

### **Problema: Deploy não inicia**
- **Solução:** Verificar webhooks no GitHub Settings → Webhooks
- **Solução:** Re-conectar repositório no Vercel

### **Problema: Build falha**
- **Solução:** Verificar logs no Vercel
- **Solução:** Testar localmente: `npm run build`

### **Problema: PWA não funciona**
- **Solução:** Verificar `manifest.json` e Service Worker
- **Solução:** Testar em https://www.pwabuilder.com/

### **Problema: Cache antigo**
- **Solução:** Sistema de atualização automática já configurado
- **Solução:** Forçar update: `AutoUpdateManager.forceUpdate()`

## ✅ Status Atual

### **Configuração Completa:**
- ✅ **GitHub** conectado ao Vercel
- ✅ **Deploy automático** configurado
- ✅ **PWA** funcionando
- ✅ **Service Worker** com cache versionado
- ✅ **Botão de histórico** restaurado
- ✅ **Sistema de atualização** automática

### **Pronto para Produção:**
```bash
# Faça push para testar:
git add .
git commit -m "test: deploy automático"
git push origin master
```

## 📞 Suporte

### **Links Úteis:**
- **Vercel Docs:** https://vercel.com/docs
- **Nuxt Deployment:** https://nuxt.com/docs/getting-started/deployment
- **PWA Guide:** https://web.dev/progressive-web-apps/

### **Monitoramento:**
- **Vercel Analytics:** Monitor de performance
- **GitHub Insights:** Atividade do repositório
- **Console do Navegador:** Debug do PWA

---

**🎯 Sistema configurado para deploy automático!**  
**Qualquer push para `master` vai gerar um novo deploy no Vercel.**