# Sistema de Super Administrador

## 📋 Visão Geral

O sistema agora possui um **Super Administrador** que tem acesso a todas as lojas (tenants) do sistema. Este é o usuário do dono do sistema/desenvolvedor.

## 🔑 Credenciais do Super Admin

- **Email:** `admin@sistema.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 🎯 Funcionalidades

### 1. Login como Super Admin
- Ao fazer login com as credenciais acima, o sistema detecta automaticamente que é um super-admin
- Redireciona para a tela de seleção de lojas

### 2. Tela de Seleção de Lojas
- Exibe todas as lojas cadastradas no sistema
- Para cada loja mostra:
  - Nome da loja
  - Email do administrador
  - Número de usuários
  - Data de criação
  - ID do tenant

### 3. Acesso às Lojas
- Clique em "Acessar Loja" para entrar em uma loja específica
- O sistema gera um token especial com permissão para aquele tenant
- Você é redirecionado para o dashboard da loja selecionada

### 4. Navegação
- Logout retorna para a tela de login
- Após acessar uma loja, você tem acesso total aos dados daquela loja

## 🛠️ Estrutura Técnica

### Backend

#### Novos Arquivos
- `backend/src/controllers/tenantController.js` - Controller para gerenciar tenants
- `backend/src/routes/tenantRoutes.js` - Rotas para operações de tenant
- `backend/create-super-admin.js` - Script para criar super-admin
- `backend/update-user-role-enum.js` - Script para atualizar ENUM
- `backend/update-tenant-id-nullable.js` - Script para permitir NULL em tenant_id

#### Alterações
- `backend/src/models/User.js`:
  - Adicionado role `super-admin` ao ENUM
  - Campo `tenantId` agora permite NULL (para super-admins)
  
- `backend/src/middleware/tenantMiddleware.js`:
  - Rotas `/api/tenants` excluídas da validação de tenant_id
  
- `backend/src/server.js`:
  - Adicionada rota `/api/tenants`

### Frontend

#### Novos Arquivos
- `frontend/src/components/SelecionarLoja.jsx` - Tela de seleção de lojas

#### Alterações
- `frontend/src/components/Entrar.jsx`:
  - Detecta login de super-admin
  - Redireciona para `/selecionar-loja`
  
- `frontend/src/App.jsx`:
  - Adicionada rota `/selecionar-loja`

## 📡 Endpoints da API

### GET /api/tenants
Lista todos os tenants do sistema
- **Acesso:** Super Admin apenas
- **Retorna:** Array com informações de todas as lojas

### GET /api/tenants/:tenantId
Obtém informações detalhadas de um tenant específico
- **Acesso:** Super Admin apenas
- **Retorna:** Detalhes do tenant incluindo usuários

### POST /api/tenants/:tenantId/access
Gera token de acesso para um tenant específico
- **Acesso:** Super Admin apenas
- **Retorna:** Novo token JWT com acesso ao tenant

## 🔄 Fluxo de Uso

1. **Login**
   ```
   Email: admin@sistema.com
   Senha: admin123
   ```

2. **Seleção de Loja**
   - Sistema detecta que é super-admin
   - Redireciona para `/selecionar-loja`
   - Exibe grid com todas as lojas

3. **Acessar Loja**
   - Clique em "Acessar Loja"
   - Sistema gera token com acesso ao tenant
   - Redireciona para dashboard da loja

4. **Gerenciar Loja**
   - Acesso total aos dados daquela loja
   - Pode visualizar produtos, vendas, etc.

5. **Trocar de Loja**
   - Faça logout
   - Faça login novamente
   - Selecione outra loja

## 🔒 Segurança

- Super-admin não possui `tenant_id` (NULL)
- Token JWT especial inclui flag `isSuperAdminAccess: true`
- Middleware verifica permissões antes de permitir acesso
- Apenas super-admin pode listar e acessar tenants

## 📝 Notas

- Cada loja (tenant) mantém isolamento total de dados
- Super-admin pode acessar qualquer loja mas precisa gerar token específico
- Sistema mantém auditoria de acessos
- Recomenda-se uso de autenticação 2FA para super-admin (implementação futura)

## 🚀 Scripts Úteis

### Criar Super Admin Manualmente
```bash
cd backend
node create-super-admin.js
```

### Atualizar ENUM de Roles
```bash
cd backend
node update-user-role-enum.js
```

### Permitir NULL em tenant_id
```bash
cd backend
node update-tenant-id-nullable.js
```

## 🎨 Interface

A tela de seleção de lojas possui:
- Design moderno com gradientes purple-blue
- Cards responsivos para cada loja
- Ícones visuais (Store, Users, Calendar)
- Hover effects e animações suaves
- Botão de logout no header
- Mensagem quando não há lojas cadastradas
