const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Supplier = require('./Supplier');
const User = require('./User');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numeroPedido: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  tenantId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  },
  dataPedido: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataPrevisaoEntrega: {
    type: DataTypes.DATEONLY
  },
  dataEntrega: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pendente', 'aprovado', 'em_transito', 'recebido', 'cancelado'),
    defaultValue: 'pendente'
  },
  itens: {
    type: DataTypes.JSON,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  frete: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  desconto: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  formaPagamento: {
    type: DataTypes.STRING
  },
  observacoes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'purchase_orders',
  timestamps: true,
  scopes: {
    withDeleted: {
      where: {},
      paranoid: false
    }
  }
});

PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'fornecedor' });
PurchaseOrder.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

module.exports = PurchaseOrder;
