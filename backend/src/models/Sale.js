const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  },
  status: {
    type: DataTypes.ENUM('ativo', 'cancelado'),
    allowNull: false,
    defaultValue: 'ativo',
    comment: 'Status da venda: ativo ou cancelado'
  },
  motivoCancelamento: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'motivo_cancelamento',
    comment: 'Motivo do cancelamento da venda'
  },
  canceladoPor: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cancelado_por',
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'ID do usuário que cancelou a venda'
  },
  canceladoEm: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelado_em',
    comment: 'Data e hora do cancelamento'
  },
  creditoUtilizado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'credito_utilizado',
    comment: 'Valor de crédito utilizado pelo cliente nesta venda'
  },
  debitoPago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'debito_pago',
    comment: 'Valor de débito pendente pago junto com esta venda'
  },
  tipoDesconto: {
    type: DataTypes.ENUM('valor', 'percentual'),
    allowNull: true,
    field: 'tipo_desconto',
    comment: 'Tipo de desconto aplicado: valor fixo ou percentual'
  },
  valorDescontoOriginal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'valor_desconto_original',
    comment: 'Valor original do desconto informado (antes do cálculo)'
  },
  tenant_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'vendas',
  timestamps: true,
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = Sale;
