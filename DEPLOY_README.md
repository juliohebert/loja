# 🚀 Configurações para Deploy - Resumo Rápido

Este projeto está preparado para deploy gratuito em:
- **Frontend:** Vercel
- **Backend:** Render.com  
- **Banco:** Neon.tech

---

## 📁 Arquivos Criados

### Backend
- `Dockerfile` - Container Docker (opcional)
- `.dockerignore` - Arquivos ignorados no Docker
- `.env.example` - Template de variáveis de ambiente
- `build.sh` - Script de build

### Frontend
- `vercel.json` - Configuração do Vercel
- `.env.example` - Template de variáveis
- `.env` - Arquivo de ambiente local
- `.gitignore` - Ignorar arquivos sensíveis
- `build.sh` - Script de build
- `src/config/api.js` - Configuração centralizada de API

### Raiz
- `render.yaml` - Configuração do Render.com
- `DEPLOY.md` - **Guia completo passo a passo** ⭐

---

## ⚡ Quick Start

### 1. Leia o guia completo
```bash
cat DEPLOY.md
```

### 2. Configure variáveis de ambiente
```bash
# Backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas credenciais

# Frontend  
cp frontend/.env.example frontend/.env.local
# Edite frontend/.env.local com URL da API
```

### 3. Teste localmente
```bash
# Backend
cd backend && npm install && npm start

# Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

### 4. Deploy
1. Crie conta no [Neon.tech](https://neon.tech) → PostgreSQL
2. Crie conta no [Render.com](https://render.com) → Backend
3. Crie conta no [Vercel](https://vercel.com) → Frontend
4. Siga o `DEPLOY.md` passo a passo

---

## 🔑 Variáveis de Ambiente Necessárias

### Backend (Render.com)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...  # Do Neon.tech
JWT_SECRET=...                 # Gere um token seguro
CORS_ORIGIN=https://seu-frontend.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://sua-api.onrender.com
```

---

## 📚 Documentação Detalhada

Consulte `DEPLOY.md` para:
- Guia passo a passo completo
- Screenshots e instruções detalhadas
- Solução de problemas comuns
- Checklist de deploy
- Dicas de performance

---

## 💰 Custos

**100% GRATUITO** dentro dos limites:
- Neon: 512MB PostgreSQL
- Render: 750h/mês (suficiente para 1 app)
- Vercel: Ilimitado para projetos pessoais

---

## 🆘 Suporte

Problemas? Verifique:
1. `DEPLOY.md` - Seção "Solução de Problemas"
2. Logs no Render/Vercel dashboard
3. Variáveis de ambiente configuradas
4. CORS habilitado

---

**✅ Tudo pronto! Leia o DEPLOY.md e coloque seu sistema online!** 🎉
