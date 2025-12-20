# 🚀 Deploy no Render - Instruções Rápidas

## Passo 1: Fazer Commit das Alterações

```bash
cd /home/julio/Documentos/www/loja_v2

git add .
git commit -m "feat: configuração de produção e correções"
git push origin main
```

## Passo 2: Criar Serviço no Render

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `juliohebert/loja`
4. Configure:

### Build & Deploy
- **Name**: `loja-backend`
- **Region**: `Oregon (US West)` ou `Ohio (US East)`
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm run start:prod`

## Passo 3: Configurar Variáveis de Ambiente

No Render, em **Environment**, adicione:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neondb_owner:npg_aqfY3Ih6vZUj@ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
DB_HOST=ep-delicate-forest-ackskoii-pooler.sa-east-1.aws.neon.tech
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_aqfY3Ih6vZUj
DB_PORT=5432
JWT_SECRET=f7d6ce856e4e18dbb61c684810e6cffc77bb209dbc249ad7e34347ec08010b0d
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://loja-seven-theta.vercel.app
```

## Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (3-5 minutos)
3. Copie a URL gerada (ex: `https://loja-backend-xxxx.onrender.com`)

## Passo 5: Atualizar Frontend

Edite `frontend/.env.production`:
```env
VITE_API_URL=https://loja-backend-xxxx.onrender.com
```

Faça commit e push:
```bash
git add frontend/.env.production
git commit -m "feat: atualizar URL do backend para Render"
git push origin main
```

No Vercel, o deploy automático irá pegar as mudanças.

## Passo 6: Testar

Acesse no celular:
```
https://loja-seven-theta.vercel.app
```

E faça login com:
- Email: juliohebertds@gmail.com
- Senha: Julio@123

---

## ⚡ Atalho Rápido

```bash
# 1. Commit
cd /home/julio/Documentos/www/loja_v2
git add .
git commit -m "feat: produção ready"
git push

# 2. Acesse: https://dashboard.render.com
# 3. New Web Service → Conecte repo → Configure conforme acima
# 4. Deploy!
```

**Tempo estimado**: 10 minutos ⏱️
