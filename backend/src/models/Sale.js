const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numeroVenda: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'numero_venda'
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
  vendedor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  clienteId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cliente_id',
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  caixaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'caixa_id',
    references: {
      model: 'caixas',
      key: 'id'
    }
  },
  itens: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  formaPagamento: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'forma_pagamento'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  desconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  troco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_hora'
  }
}, {
  tableName: 'vendas',
  timestamps: true,
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = Sale;
