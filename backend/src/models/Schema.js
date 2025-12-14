const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Sale = require('./Sale');
const Supplier = require('./Supplier');
const OrdemCompra = require('./PurchaseOrder');
const ContaPagar = require('./AccountPayable');
const ContaReceber = require('./AccountReceivable');

/**
 * 🎯 OBJECTIVE: Define PostgreSQL Data Models for a Clothing Store System.
 * STACK: Node.js, Express, Sequelize ORM.
 *
 * 📝 REQUIREMENTS:
 * 1. Product: Base info (name, brand, cost, price).
 * 2. Variation: Specific SKU, Size (P, M, G), Color.
 * 3. Stock: Quantity management per Variation.
 * 4. Relationships: Product -> hasMany -> Variations -> hasOne -> Stock.
 */

// 1. Define Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'nome',
    validate: {
      notEmpty: true
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao'
  },
  marca: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'marca'
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Geral',
    field: 'categoria'
  },
  precoCusto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'preco_custo',
    validate: {
      min: 0
    }
  },
  precoVenda: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'preco_venda',
    validate: {
      min: 0
    }
  },
  imagens: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    field: 'imagens',
    comment: 'Array de URLs ou base64 das imagens do produto'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'ativo'
  },
  tenant_id: {
    type: DataTypes.STRING(255),
    allowNull: true, // Temporariamente NULL para migração
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'produtos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 2. Define Variation Model (SKU, Size, Color)
const Variation = sequelize.define('Variation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  produtoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'produto_id',
    references: {
      model: 'produtos',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'sku'
  },
  tamanho: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'tamanho',
    comment: 'Ex: PP, P, M, G, GG, XG'
  },
  cor: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'cor'
  },
  codigoBarras: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'codigo_barras'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'ativo'
  }
}, {
  tableName: 'variacoes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 3. Define Stock Model (Quantity, Safety Stock)
const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  variacaoId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'variacao_id',
    references: {
      model: 'variacoes',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'quantidade',
    validate: {
      min: 0
    }
  },
  limiteMinimo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    field: 'limite_minimo',
    comment: 'Alerta de estoque mínimo'
  },
  localizacao: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'localizacao',
    comment: 'Localização física no estoque'
  }
}, {
  tableName: 'estoques',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 4. Define Associations
// Product hasMany Variation
Product.hasMany(Variation, {
  foreignKey: 'produtoId',
  as: 'variacoes',
  onDelete: 'CASCADE'
});

// Variation belongsTo Product
Variation.belongsTo(Product, {
  foreignKey: 'produtoId',
  as: 'produto'
});

// Variation hasOne Stock
Variation.hasOne(Stock, {
  foreignKey: 'variacaoId',
  as: 'estoque',
  onDelete: 'CASCADE'
});

// Stock belongsTo Variation
Stock.belongsTo(Variation, {
  foreignKey: 'variacaoId',
  as: 'variacao'
});

// Método helper para calcular margem
Product.prototype.calcularMargem = function() {
  if (this.precoCusto > 0) {
    return ((this.precoVenda - this.precoCusto) / this.precoCusto * 100).toFixed(2);
  }
  return 0;
};

// 5. Define Customer Model
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'nome',
    validate: {
      notEmpty: true
    }
  },
  cpf: {
    type: DataTypes.STRING(14),
    allowNull: false,
    unique: true,
    field: 'cpf',
    validate: {
      notEmpty: true
    }
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'telefone'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'email',
    validate: {
      isEmail: true
    }
  },
  endereco: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'endereco'
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'cidade'
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'estado'
  },
  cep: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'cep'
  },
  debito: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'debito',
    validate: {
      min: 0
    }
  },
  limiteCredito: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'limite_credito',
    validate: {
      min: 0
    }
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacoes'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'ativo'
  },
  tenant_id: {
    type: DataTypes.STRING(255),
    allowNull: true, // Temporariamente NULL para migração
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 6. Define CustomerTransaction Model (histórico de débitos/créditos)
const CustomerTransaction = sequelize.define('CustomerTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  clienteId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'cliente_id',
    references: {
      model: 'clientes',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  tipo: {
    type: DataTypes.ENUM('adicionar', 'pagar', 'aumentar-credito', 'diminuir-credito', 'usar-credito'),
    allowNull: false,
    field: 'tipo'
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'valor',
    validate: {
      min: 0
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao'
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'data'
  },
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'data_hora'
  }
}, {
  tableName: 'transacoes_clientes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 7. Define Customer Associations
Customer.hasMany(CustomerTransaction, {
  foreignKey: 'clienteId',
  as: 'transacoes',
  onDelete: 'CASCADE'
});

CustomerTransaction.belongsTo(Customer, {
  foreignKey: 'clienteId',
  as: 'cliente'
});

// Método helper para calcular crédito disponível
Customer.prototype.calcularCreditoDisponivel = function() {
  return Math.max(0, this.limiteCredito - this.debito);
};

// 8. Define CashRegister Model (Caixa)
const CashRegister = sequelize.define('CashRegister', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'usuario_id',
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  dataAbertura: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'data_abertura'
  },
  dataFechamento: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_fechamento'
  },
  saldoInicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'saldo_inicial'
  },
  saldoFinal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'saldo_final'
  },
  status: {
    type: DataTypes.ENUM('aberto', 'fechado'),
    allowNull: false,
    defaultValue: 'aberto',
    field: 'status'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacoes'
  },
  tenant_id: {
    type: DataTypes.STRING(255),
    allowNull: true, // Temporariamente NULL para migração
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'caixas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// 9. Define Configuration Model (Configurações)
const Configuration = sequelize.define('Configuration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  chave: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'chave'
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'valor'
  },
  tipo: {
    type: DataTypes.ENUM('texto', 'numero', 'booleano', 'json'),
    allowNull: false,
    defaultValue: 'texto',
    field: 'tipo'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao'
  },
  tenant_id: {
    type: DataTypes.STRING,
    allowNull: true, // Temporariamente NULL para migração
    defaultValue: 'default',
    field: 'tenant_id', // Coluna no banco é tenant_id
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'configuracoes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  indexes: [
    {
      unique: true,
      fields: ['chave', 'tenant_id'], // Usar nome da coluna no banco
      name: 'configuracoes_chave_tenant_unique'
    }
  ]
});

// 10. Define CashRegister Associations
CashRegister.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});

User.hasMany(CashRegister, {
  foreignKey: 'usuarioId',
  as: 'caixas'
});

// 11. Define Sale Associations
Sale.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});

Sale.belongsTo(Customer, {
  foreignKey: 'clienteId',
  as: 'cliente'
});

Sale.belongsTo(CashRegister, {
  foreignKey: 'caixaId',
  as: 'caixa'
});

User.hasMany(Sale, {
  foreignKey: 'usuarioId',
  as: 'vendas'
});

Customer.hasMany(Sale, {
  foreignKey: 'clienteId',
  as: 'vendas'
});

module.exports = { 
  User, 
  Product, 
  Variation, 
  Stock, 
  Customer, 
  CustomerTransaction, 
  CashRegister, 
  Configuration, 
  Sale, 
  Supplier,
  OrdemCompra,
  ContaPagar,
  ContaReceber,
  sequelize 
};
