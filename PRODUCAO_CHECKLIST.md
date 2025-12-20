# ✅ Checklist de Produção - Sistema de Loja

## 🎯 Status Atual: PRONTO PARA PRODUÇÃO

### ✅ Correções Aplicadas

#### 1. **Backend - Autenticação e Segurança**
- ✅ Hash da senha atualizado no banco Neon
- ✅ Logs de debug removidos do `authController.js`
- ✅ Tratamento de erros melhorado
- ✅ Mensagens de erro genéricas para segurança

#### 2. **Backend - Configuração de Produção**
- ✅ Script `start-production.js` criado para carregar `.env.production`
- ✅ PM2 configurado corretamente
- ✅ Conexão com banco Neon funcionando
- ✅ CORS configurado para aceitar frontend do Vercel
- ✅ Logs simplificados em produção
- ✅ Tratamento de erros globais adicionado

#### 3. **Frontend - Configuração de API**
- ✅ `api.js` atualizado para usar `VITE_API_URL`
- ✅ `config/api.js` com fallback correto
- ✅ `.env.production` configurado para Render

#### 4. **Variáveis de Ambiente**
- ✅ Backend `.env.production` configurado:
  - `DATABASE_URL`: Neon PostgreSQL
  - `CORS_ORIGIN`: Frontend Vercel
  - `JWT_SECRET`: Configurado
  - `NODE_ENV`: production

---

## 📋 Comandos Úteis

### Backend (PM2)
```bash
# Verificar status
pm2 status

# Ver logs
pm2 logs loja-backend --lines 50

# Reiniciar
pm2 restart loja-backend

# Parar
pm2 stop loja-backend

# Iniciar manualmente
cd /home/julio/Documentos/www/loja_v2/backend
pm2 start start-production.js --name loja-backend

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

### Testar Endpoints
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juliohebertds@gmail.com","senha":"Julio@123"}'

# Produtos (com token)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"juliohebertds@gmail.com","senha":"Julio@123"}' -s | jq -r '.token')
curl -X GET http://localhost:3001/api/products -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Próximos Passos para Deploy Completo

### 1. **Deploy do Backend no Render**

1. Criar conta no [Render.com](https://render.com)
2. Criar novo **Web Service**
3. Conectar ao repositório GitHub
4. Configurar:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node start-production.js`
   - **Environment**: Node
   - **Region**: Oregon (US West) ou mais próximo

5. **Variáveis de Ambiente** no Render:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_aqfY3Ih6vZUj@ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   DB_HOST=ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech
   DB_NAME=neondb
   DB_PASSWORD=npg_aqfY3Ih6vZUj
   DB_PORT=5432
   DB_USER=neondb_owner
   JWT_SECRET=f7d6ce856e4e18dbb61c684810e6cffc77bb209dbc249ad7e34347ec08010b0d
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://loja-seven-theta.vercel.app
   ```

6. Deploy e copiar a URL gerada (ex: `https://loja-backend.onrender.com`)

### 2. **Atualizar Frontend para Usar Backend do Render**

Editar `frontend/.env.production`:
```env
VITE_API_URL=https://loja-backend.onrender.com
```

### 3. **Deploy do Frontend no Vercel**

1. Já está no Vercel: `https://loja-seven-theta.vercel.app`
2. Atualizar variável de ambiente:
   - Settings → Environment Variables
   - Adicionar: `VITE_API_URL=https://loja-backend.onrender.com`
3. Redeploy: `vercel --prod` ou via dashboard

### 4. **Atualizar CORS no Backend**

Após deploy no Render, atualizar `.env.production` do backend:
```env
CORS_ORIGIN=https://loja-seven-theta.vercel.app
```

E reiniciar o serviço no Render.

---

## 🔍 Monitoramento

### Logs do Backend
- **PM2**: `pm2 logs loja-backend`
- **Render**: Dashboard → Logs

### Logs do Frontend
- **Vercel**: Dashboard → Deployments → View Function Logs

### Saúde do Banco
```bash
PGPASSWORD='npg_aqfY3Ih6vZUj' psql -h ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb -c "SELECT COUNT(*) FROM usuarios;"
```

---

## 🛡️ Segurança Implementada

- ✅ Senhas hasheadas com bcrypt (salt rounds: 10)
- ✅ JWT com expiração de 7 dias
- ✅ CORS restrito a domínios específicos
- ✅ Mensagens de erro genéricas (não expõem detalhes internos)
- ✅ Conexão SSL com banco de dados
- ✅ Variáveis de ambiente protegidas
- ✅ Tratamento de erros global

---

## 📝 Credenciais de Acesso

### Produção
- **Email**: juliohebertds@gmail.com
- **Senha**: Julio@123

### Banco de Dados (Neon)
- **Host**: ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech
- **Database**: neondb
- **User**: neondb_owner
- **Password**: npg_aqfY3Ih6vZUj

---

## 🎉 Sistema Funcionando!

O backend está rodando localmente em **produção** com:
- ✅ Banco de dados Neon conectado
- ✅ Autenticação funcionando
- ✅ CORS configurado
- ✅ Logs otimizados
- ✅ PM2 gerenciando o processo

**Próximo passo**: Deploy no Render para acesso público!
