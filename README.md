# Agenda PWA - Aplicação para Celular

Uma aplicação PWA (Progressive Web App) offline-first para gerenciamento de lembretes e compromissos, com armazenamento local no celular.

## 🚀 Funcionalidades

### 📌 Gerenciamento de Lembretes
- Criar, visualizar, editar e excluir lembretes
- Definir prioridade (Baixa, Média, Alta)
- Configurar data e hora do lembrete
- Adicionar notas detalhadas
- Marcar como concluído

### 📅 Gerenciamento de Compromissos
- Criar, visualizar, editar e excluir compromissos
- Definir localização
- Configurar data/hora de início e fim
- Adicionar notas
- Marcar como concluído

### 📋 Histórico de Ações
- Registro completo de todas as operações (CREATE, UPDATE, DELETE)
- Metadados detalhados incluindo conteúdo completo de itens deletados
- Filtros por operação, entidade e data
- Visualização detalhada de cada registro

### 📱 PWA (Progressive Web App)
- Funciona offline
- Pode ser instalada no celular
- Interface responsiva para mobile
- Cache agressivo para performance

## 🛠️ Tecnologias

- **Vue 3** - Framework frontend
- **Nuxt 4** - Framework fullstack
- **PGlite** - Banco de dados PostgreSQL em WASM (armazenamento local)
- **Pinia** - Gerenciamento de estado
- **TypeScript** - Tipagem estática
- **Workbox** - Cache e funcionalidades PWA

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ ou 20+
- npm ou yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd agenda-pwa
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute em modo desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   - Abra http://localhost:3001 no navegador

5. **Build para produção**
   ```bash
   npm run build
   npm run preview
   ```

## 🗄️ Estrutura do Banco de Dados

A aplicação usa **PGlite**, uma implementação PostgreSQL em WASM que roda no navegador:

### Tabelas
1. **reminders** - Lembretes
   - id, title, notes, remind_at, done, priority, created_at, updated_at

2. **appointments** - Compromissos
   - id, title, location, notes, starts_at, ends_at, done, created_at, updated_at

3. **audit_logs** - Histórico de ações
   - id, operation, entity, entity_id, description, metadata, created_at

### Características do Armazenamento
- **100% local** - Dados armazenados no dispositivo
- **Persistente** - Dados mantidos entre sessões
- **SQL completo** - Suporte a queries SQL complexas
- **Índices** - Performance otimizada com índices

## 📱 Instalação como PWA

### No Chrome/Edge:
1. Acesse a aplicação no navegador
2. Clique no ícone de instalação na barra de endereços
3. Siga as instruções para instalar

### No Safari:
1. Acesse a aplicação
2. Toque no botão Compartilhar
3. Role para baixo e toque em "Adicionar à Tela de Início"

## 🔧 Funcionalidades Offline

- **Cache agressivo** - Aplicação funciona sem internet
- **Sincronização** - Dados são persistidos localmente
- **Background sync** - Sincronização quando a conexão retorna (futuro)

## 🎯 Uso

### Criando um Lembrete
1. Toque em "+ Novo Lembrete"
2. Preencha título, data/hora, prioridade e notas
3. Toque em "Salvar Lembrete"

### Criando um Compromisso
1. Toque em "+ Novo Compromisso"
2. Preencha título, data/hora de início, local e notas
3. Toque em "Salvar Compromisso"

### Visualizando Histórico
1. Toque em "📋 Ver Histórico"
2. Use os filtros para encontrar registros específicos
3. Toque em "🔍 Ver Detalhes" para mais informações

## 📊 Funcionalidades Futuras

- [ ] Notificações push para lembretes
- [ ] Sincronização com nuvem (opcional)
- [ ] Exportação/importação de dados
- [ ] Temas claro/escuro
- [ ] Categorias e tags
- [ ] Pesquisa avançada
- [ ] Relatórios e estatísticas

## 🐛 Solução de Problemas

### Problema: Aplicação não carrega
- Verifique se o servidor está rodando (`npm run dev`)
- Limpe o cache do navegador
- Verifique o console do navegador para erros

### Problema: Dados não são salvos
- Verifique se o PGlite está inicializado
- Confira o console para erros de banco de dados
- Tente recarregar a página

### Problema: Interface não responsiva
- Verifique se há erros no console
- Tente em outro navegador
- Limpe o cache do service worker

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com os mantenedores.

---

Desenvolvido com ❤️ para facilitar o gerenciamento de agenda no celular, mesmo offline!
