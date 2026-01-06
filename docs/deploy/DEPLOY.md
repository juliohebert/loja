# 🚀 Guia Completo de Deploy - Sistema de Loja

Este guia mostra como colocar seu sistema online **100% GRÁTIS** usando:
- **Frontend:** Vercel (React/Vite)
- **Backend:** Render.com (Node.js)
- **Banco de Dados:** Neon.tech (PostgreSQL)

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deploy do Banco de Dados (Neon.tech)](#1-deploy-do-banco-de-dados-neontech)
3. [Deploy do Backend (Render.com)](#2-deploy-do-backend-rendercom)
4. [Deploy do Frontend (Vercel)](#3-deploy-do-frontend-vercel)
5. [Configurações Finais](#4-configurações-finais)
6. [Solução de Problemas](#5-solução-de-problemas)

---

## Pré-requisitos

- [ ] Conta no GitHub (para versionamento do código)
- [ ] Conta no Neon.tech (banco de dados PostgreSQL)
- [ ] Conta no Render.com (backend Node.js)
- [ ] Conta no Vercel (frontend React)

**Todas as contas são gratuitas!**

---

## 1. Deploy do Banco de Dados (Neon.tech)

### 1.1. Criar Projeto no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Faça login ou crie uma conta gratuita
3. Clique em **"New Project"**
4. Configure:
   - **Project name:** loja-roupas
   - **Region:** US East (Ohio) - escolha o mais próximo
   - **PostgreSQL version:** 16 (mais recente)
5. Clique em **"Create Project"**

### 1.2. Copiar Connection String

1. No dashboard do projeto, clique em **"Connection Details"**
2. Copie a **Connection String** (formato: `postgresql://usuario:senha@host/dbname`)
3. **Guarde essa string**, você vai precisar no próximo passo

### 1.3. Criar Tabelas no Banco

**Opção A: Usar as Migrations (Recomendado)**
```bash
# No terminal, na pasta backend/
npm install
npx sequelize-cli db:migrate
```

**Opção B: Executar SQL direto no Neon**
1. No dashboard do Neon, vá em **"SQL Editor"**
2. Execute os scripts de criação de tabelas do arquivo `backend/migrations/`

---

## 2. Deploy do Backend (Render.com)

### 2.1. Preparar o Repositório Git

```bash
# Certifique-se de estar na raiz do projeto
cd /home/julio/Documentos/www/loja_v2

# Adicionar e commitar as mudanças
git add .
git commit -m "feat: Preparar projeto para deploy em produção"
git push origin main
```

### 2.2. Criar Web Service no Render

1. Acesse [render.com](https://render.com)
2. Faça login ou crie uma conta gratuita
3. No dashboard, clique em **"New +"** → **"Web Service"**
4. Conecte seu repositório GitHub:
   - Clique em **"Connect GitHub"**
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório **juliohebert/loja**

### 2.3. Configurar o Web Service

**Configurações Básicas:**
- **Name:** `loja-api` (ou outro nome de sua preferência)
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`

**Plano:**
- Selecione **"Free"** (750 horas/mês grátis)

### 2.4. Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

```bash
NODE_ENV=production
PORT=3001

# Connection String do Neon.tech (cole aqui)
DATABASE_URL=postgresql://usuario:senha@host/dbname

# Gerar JWT Secret seguro (execute no terminal):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=sua_chave_gerada_aqui_64_caracteres

# URL do frontend (será atualizada depois)
CORS_ORIGIN=https://seu-frontend.vercel.app
```

### 2.5. Criar o Service

1. Clique em **"Create Web Service"**
2. Aguarde o deploy (3-5 minutos)
3. Quando estiver pronto, copie a URL: `https://loja-api.onrender.com`

### 2.6. Testar o Backend

Acesse no navegador: `https://loja-api.onrender.com/health`

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2025-12-14T..."
}
```

---

## 3. Deploy do Frontend (Vercel)

### 3.1. Preparar Variáveis de Ambiente

1. Na pasta `frontend/`, crie o arquivo `.env.production`:

```bash
# URL da API Backend (copie do Render)
VITE_API_URL=https://loja-api.onrender.com
```

2. **IMPORTANTE:** Adicione `.env.production` ao `.gitignore` se ainda não estiver

### 3.2. Fazer Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Importe o repositório **juliohebert/loja**

### 3.3. Configurar o Projeto

**Configurações:**
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Environment Variables:**
Adicione a variável:
```
VITE_API_URL = https://loja-api.onrender.com
```

### 3.4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Quando pronto, copie a URL: `https://seu-projeto.vercel.app`

---

## 4. Configurações Finais

### 4.1. Atualizar CORS no Backend

1. Volte ao Render.com
2. Vá em **Settings** → **Environment**
3. Atualize `CORS_ORIGIN` com a URL do Vercel:
```
CORS_ORIGIN=https://seu-projeto.vercel.app
```
4. Clique em **"Save Changes"**
5. O Render irá fazer redeploy automaticamente

### 4.2. Atualizar URLs no Frontend

Se houver URLs hardcoded no código, substitua por variáveis de ambiente:

```javascript
// ❌ Evite:
const API_URL = 'http://localhost:3001';

// ✅ Use:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 4.3. Criar Usuário Super Admin

1. Acesse o terminal do Render (Dashboard → Shell)
2. Execute o script:
```bash
node create-super-admin.js
```

Ou use a API diretamente:
```bash
curl -X POST https://loja-api.onrender.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@loja.com",
    "password": "senha123",
    "funcao": "super-admin"
  }'
```

---

## 5. Solução de Problemas

### ❌ Erro 503 Service Unavailable (Render)

**Causa:** Free tier do Render desliga após 15 minutos de inatividade.

**Solução:** 
- Primeira requisição leva 30-60 segundos para "acordar"
- Use um serviço de uptime monitor (UptimeRobot) para manter ativo

### ❌ CORS Error no Frontend

**Sintomas:** 
```
Access to fetch at 'https://loja-api.onrender.com' from origin 'https://seu-projeto.vercel.app' has been blocked by CORS policy
```

**Solução:**
1. Verifique se `CORS_ORIGIN` no Render está correto
2. Não use `/` no final da URL
3. Redeploy do backend após alterar

### ❌ Database Connection Error

**Sintomas:**
```
SequelizeConnectionError: connect ECONNREFUSED
```

**Solução:**
1. Verifique se `DATABASE_URL` está configurado corretamente
2. Teste a connection string localmente
3. Verifique se o banco Neon está ativo

### ❌ Environment Variable não carrega no Frontend

**Sintomas:** `undefined` ao acessar `import.meta.env.VITE_API_URL`

**Solução:**
1. Variáveis DEVEM começar com `VITE_`
2. Redeploy do frontend após adicionar variável
3. Limpe o cache do navegador (Ctrl+Shift+R)

### ❌ Build Failing no Vercel

**Solução:**
1. Verifique os logs de build no Vercel
2. Rode `npm run build` localmente para testar
3. Verifique se todas as dependências estão no `package.json`

---

## 📊 Checklist Final

Antes de considerar o deploy concluído, verifique:

- [ ] Backend responde em `/health`
- [ ] Frontend carrega corretamente
- [ ] Login funciona
- [ ] Cadastro de produtos funciona
- [ ] Vendas podem ser registradas
- [ ] Relatórios carregam dados
- [ ] URLs do ambiente estão corretas
- [ ] CORS configurado corretamente
- [ ] Usuário admin criado

---

## 🔒 Segurança em Produção

**Checklist de Segurança:**

- [ ] JWT_SECRET forte e único (64+ caracteres)
- [ ] Senhas dos usuários criptografadas (bcrypt)
- [ ] HTTPS habilitado (automático no Vercel/Render)
- [ ] Variáveis sensíveis em .env (não no código)
- [ ] CORS restrito ao domínio do frontend
- [ ] Rate limiting configurado (express-rate-limit)
- [ ] Validação de entrada em todas as rotas

---

## 📈 Monitoramento

**Ferramentas Gratuitas:**

1. **Render Dashboard:** Logs em tempo real do backend
2. **Vercel Analytics:** Métricas de performance do frontend
3. **Neon Metrics:** Uso do banco de dados
4. **UptimeRobot:** Monitora disponibilidade (50 monitors grátis)

---

## 💡 Dicas de Performance

1. **Backend (Render Free Tier):**
   - Primeira requisição pode levar 30-60s (cold start)
   - Use UptimeRobot para manter "acordado"
   - Considere upgrade para plano pago ($7/mês) para melhor performance

2. **Frontend (Vercel):**
   - Otimize imagens (use WebP)
   - Lazy loading de componentes
   - Minimize bundle size

3. **Banco de Dados (Neon):**
   - Free tier: 512MB storage, 1 projeto
   - Use indexes em queries frequentes
   - Monitore conexões abertas

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs:
   - Render: Dashboard → Logs
   - Vercel: Deployments → Log
   - Neon: Query insights

2. Teste localmente primeiro
3. Compare configurações com este guia
4. Consulte documentação oficial:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Neon Docs](https://neon.tech/docs)

---

## ✅ Próximos Passos

Depois do deploy:

1. Configure domínio personalizado (opcional):
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domain

2. Configure backup do banco:
   - Neon oferece snapshots automáticos

3. Configure CI/CD:
   - Já configurado automaticamente!
   - Push para `main` = deploy automático

4. Monitore custos:
   - Tudo é grátis dentro dos limites
   - Configure alertas no dashboard

---

**🎉 Parabéns! Seu sistema está online e acessível para usuários!**

URLs do seu sistema:
- Frontend: `https://seu-projeto.vercel.app`
- Backend: `https://loja-api.onrender.com`
- Docs API: `https://loja-api.onrender.com/api-docs`
