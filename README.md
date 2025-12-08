
# Vitrine360 🛍️


Sistema completo para gerenciamento de lojas de roupas, com controle de produtos, variações (tamanhos e cores), estoque e vendas. O Vitrine360 oferece uma experiência moderna e eficiente para gestão de lojas de moda.

## 🏗️ Estrutura do Projeto

```
vitrine360/
├── backend/          # API Node.js + Express + Sequelize
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── productController.js
│   │   ├── models/
│   │   │   └── Schema.js
│   │   ├── routes/
│   │   │   └── productRoutes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/         # React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/
    │   │   └── ProductForm.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🚀 Como Executar

### 1️⃣ Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL (v13 ou superior)
- npm ou yarn

### 2️⃣ Configurar o Banco de Dados

Crie um banco de dados PostgreSQL:

```bash
psql -U postgres
CREATE DATABASE loja_roupas;
\q
```

### 3️⃣ Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do PostgreSQL

# Iniciar servidor (modo desenvolvimento)
npm run dev

# OU em produção
npm start
```

O backend estará rodando em: **http://localhost:3001**

### 4️⃣ Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em: **http://localhost:3000**

## 📋 Funcionalidades

### Backend

✅ **Models (Sequelize ORM):**
- `Product`: Produto base (nome, marca, preços)
- `Variation`: Variações do produto (SKU, tamanho, cor)
- `Stock`: Controle de estoque por variação

✅ **Relacionamentos:**
- Product → hasMany → Variations
- Variation → hasOne → Stock

✅ **Endpoints da API:**

```
POST   /api/products              # Criar produto com variações
GET    /api/products              # Listar todos os produtos
GET    /api/products/:id          # Buscar produto específico
PATCH  /api/products/stock/:id    # Atualizar estoque
```

✅ **Transações de Banco:**
- Criação atômica de produto + variações + estoque
- Rollback automático em caso de erro

### Frontend

✅ **Formulário Responsivo:**
- Campos para informações do produto
- Lista dinâmica de variações
- Cálculo automático de margem de lucro
- Validação de campos obrigatórios

✅ **Recursos:**
- Adicionar/remover variações dinamicamente
- Design moderno com Tailwind CSS
- Ícones com Lucide React
- Feedback visual de sucesso/erro

## 🎯 Exemplo de Uso

### Criar Produto via API

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camisa Polo",
    "brand": "Nike",
    "category": "Camisetas",
    "description": "Camisa polo básica",
    "price_cost": 50.00,
    "price_sale": 120.00,
    "variations": [
      {
        "size": "M",
        "color": "Azul",
        "quantity": 10,
        "min_limit": 5
      },
      {
        "size": "G",
        "color": "Preto",
        "quantity": 15,
        "min_limit": 5
      }
    ]
  }'
```

### Resposta de Sucesso

```json
{
  "message": "Produto criado com sucesso",
  "data": {
    "product": {
      "id": "uuid-gerado",
      "name": "Camisa Polo",
      "brand": "Nike",
      "price_cost": "50.00",
      "price_sale": "120.00"
    },
    "margin": "140.00%",
    "variations": [...]
  }
}
```


## 🔧 Tecnologias Utilizadas — Vitrine360

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **dotenv** - Gerenciamento de variáveis de ambiente
- **CORS** - Habilitação de requisições cross-origin

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool rápida
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Biblioteca de ícones
- **PostCSS** - Processamento CSS

## 📝 Estrutura do Banco de Dados

```sql
products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  brand VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  price_cost DECIMAL(10,2),
  price_sale DECIMAL(10,2),
  active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

variations (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  sku VARCHAR(50) UNIQUE,
  size VARCHAR(10),
  color VARCHAR(50),
  barcode VARCHAR(50) UNIQUE,
  active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

stocks (
  id UUID PRIMARY KEY,
  variation_id UUID REFERENCES variations(id),
  quantity INTEGER,
  min_limit INTEGER,
  location VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🛡️ Validações Implementadas

- Campos obrigatórios do produto
- Pelo menos uma variação por produto
- SKU único por variação
- Código de barras único (se informado)
- Preços não negativos
- Quantidade de estoque não negativa

## 📦 Scripts Disponíveis

### Backend
```bash
npm start         # Inicia servidor em produção
npm run dev       # Inicia servidor com nodemon
npm run db:sync   # Sincroniza modelos com banco (força recriação)
```

### Frontend
```bash
npm run dev       # Inicia dev server
npm run build     # Build para produção
npm run preview   # Preview do build
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

ISC

## 👨‍💻 Autor

Desenvolvido com ❤️ por Julio e colaboradores, usando GitHub Copilot
