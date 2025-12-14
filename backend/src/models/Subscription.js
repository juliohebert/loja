const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
     lojaId: {
       type: DataTypes.STRING,
       allowNull: false,
       comment: 'ID do tenant/loja assinante' // Agora aceita tenantId string
     },
  plano: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome do plano de assinatura'
  },
  status: {
    type: DataTypes.ENUM('trial', 'ativa', 'pendente', 'suspensa', 'cancelada'),
    defaultValue: 'trial',
    allowNull: false
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dataFim: {
    type: DataTypes.DATE,
    allowNull: true
  },
  valor: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  pago: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'assinaturas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});


module.exports = Subscription;
