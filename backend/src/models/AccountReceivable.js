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
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  saleId: {
    type: DataTypes.UUID,
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
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tenant_id: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'contas_receber',
  timestamps: true
});

module.exports = AccountReceivable;
