const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccountReceivable = sequelize.define('AccountReceivable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clienteNome: {
    type: DataTypes.STRING
  },
  clienteCpfCnpj: {
    type: DataTypes.STRING
  },
  clienteTelefone: {
    type: DataTypes.STRING
  },
  saleId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'vendas',
      key: 'id'
    }
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  valorRecebido: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  dataEmissao: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataVencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataRecebimento: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pendente', 'recebido', 'vencido', 'cancelado'),
    defaultValue: 'pendente'
  },
  formaPagamento: {
    type: DataTypes.STRING
  },
  numeroParcela: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalParcelas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  comprovante: {
    type: DataTypes.STRING
  },
  tenantId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'accounts_receivable',
  timestamps: true
});

module.exports = AccountReceivable;
