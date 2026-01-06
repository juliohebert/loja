# Funcionalidade: Identidade Visual da Loja

## 📋 Descrição
Implementação de funcionalidade para permitir que cada loja personalize sua identidade visual através do upload de logo e definição do nome da loja.

## ✨ Funcionalidades

### Backend

#### 1. Upload de Logo
- **Endpoint**: `POST /api/configurations/logo/upload`
- **Middleware**: `authMiddleware`, `upload.single('logo')`
- **Validações**:
  - Tipos permitidos: JPEG, PNG, GIF, WebP
  - Tamanho máximo: 5MB
  - Armazenamento: `/backend/uploads/logos/`
- **Features**:
  - Deleta logo anterior automaticamente
  - Nome único por tenant: `logo-{tenantId}-{timestamp}.{ext}`
  - Atualiza configuração `logo_url` no banco

#### 2. Deletar Logo
- **Endpoint**: `DELETE /api/configurations/logo/delete`
- **Features**:
  - Remove arquivo físico
  - Limpa configuração `logo_url`

#### 3. Atualizar Nome da Loja
- **Endpoint**: `POST /api/configurations` (endpoint existente)
- **Payload**:
```json
{
  "chave": "nome_loja",
  "valor": "Nome da Loja",
  "tipo": "texto",
  "descricao": "Nome da loja exibido no menu sidebar"
}
```

#### 4. Arquivos de Upload
- **Servir arquivos estáticos**: `app.use('/uploads', express.static(...))`
- **URL de acesso**: `{API_URL}/uploads/logos/{filename}`

### Frontend

#### 1. Seção de Identidade Visual
Localização: `frontend/src/components/Configuracoes.jsx`

**Componentes**:
- **Card Nome da Loja**:
  - Input de texto (max 50 caracteres)
  - Botão salvar
  - Estado local: `nomeLoja`
  
- **Card Logo da Loja**:
  - Preview da imagem atual
  - Upload via input file
  - Botão para deletar logo
  - Estados: `logoUrl`, `logoPreview`, `uploadingLogo`

#### 2. Funções Principais

**`handleLogoUpload(event)`**:
- Valida tipo e tamanho do arquivo
- Mostra preview local
- Faz upload para o servidor via FormData
- Atualiza configurações após sucesso

**`handleDeleteLogo()`**:
- Confirmação via confirm()
- Remove logo do servidor
- Limpa preview local

**`handleSaveNomeLoja()`**:
- Valida nome não vazio
- Salva via endpoint de configurações
- Recarrega configurações

## 🗄️ Banco de Dados

### Tabela: `configuracoes`
```sql
-- Configuração do nome da loja
{
  chave: 'nome_loja',
  valor: 'ModaStore', -- Valor padrão
  tipo: 'texto',
  descricao: 'Nome da loja exibido no menu sidebar',
  tenant_id: '{tenant_id}'
}

-- Configuração da logo
{
  chave: 'logo_url',
  valor: '/uploads/logos/logo-{tenantId}-{timestamp}.{ext}',
  tipo: 'texto',
  descricao: 'URL da logo da loja exibida no menu sidebar',
  tenant_id: '{tenant_id}'
}
```

### Script de Inicialização
Executar: `backend/add-logo-configs.sql`
- Adiciona configurações padrão para todos os tenants existentes
- Evita duplicatas com `NOT EXISTS`

## 📦 Dependências Adicionadas

### Backend
```json
{
  "multer": "^2.0.0"
}
```

### Arquivos Criados/Modificados

**Backend**:
- `src/config/upload.js` (novo)
- `src/controllers/configurationController.js` (modificado)
- `src/routes/configurationRoutes.js` (modificado)
- `src/server.js` (modificado - servir uploads)
- `uploads/logos/.gitignore` (novo)
- `add-logo-configs.sql` (novo)

**Frontend**:
- `src/components/Configuracoes.jsx` (modificado)

## 🚀 Como Usar

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Executar Script SQL
No Neon SQL Editor, executar `add-logo-configs.sql`

### 3. Iniciar Backend
```bash
cd backend
npm run dev
```

### 4. Acessar Frontend
Navegue para: `/configuracoes`

### 5. Personalizar Loja
1. Digite o nome da loja no campo "Nome da Loja"
2. Clique em "Salvar Nome"
3. Clique em "Fazer Upload do Logo"
4. Selecione uma imagem (JPG, PNG, GIF, WebP)
5. O logo será exibido no preview
6. Para remover, clique no ícone de lixeira

## 🔒 Segurança

- Upload protegido por `authMiddleware`
- Validação de tipo MIME no multer
- Limite de tamanho: 5MB
- Isolamento por tenant_id
- Deleção automática de logos antigos

## 📝 Notas

- Arquivos de upload não são versionados (`.gitignore`)
- Cada tenant pode ter logo e nome exclusivos
- Logos antigos são deletados automaticamente ao fazer novo upload
- Configurações filtre nome_loja e logo_url dos cards gerais (seção específica)

## 🔄 Deploy

### Render.com
- Criar pasta `uploads/logos` no build
- Configurar variável de ambiente se necessário
- **Atenção**: Render usa sistema de arquivos efêmero (arquivos podem ser perdidos no redeploy)
- **Recomendação**: Migrar para armazenamento em nuvem (AWS S3, Cloudinary, etc.)

### Produção
Para produção, considere:
1. Usar serviço de armazenamento em nuvem
2. CDN para servir imagens
3. Otimização de imagens (resize, compress)
4. Backup automático
