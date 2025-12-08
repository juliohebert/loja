const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');

const AccountPayable = sequelize.define('AccountPayable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  purchaseOrderId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'purchase_orders',
      key: 'id'
    }
  },
  categoria: {
    type: DataTypes.STRING
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  valorPago: {
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
  dataPagamento: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pendente', 'pago', 'vencido', 'cancelado'),
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
  }
}, {
  tableName: 'accounts_payable',
  timestamps: true
});

AccountPayable.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'fornecedor' });
AccountPayable.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'pedidoCompra' });

module.exports = AccountPayable;
