const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.ENUM('mensal', 'trimestral', 'semestral', 'anual'),
    allowNull: false,
    defaultValue: 'mensal'
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de recursos/benefícios do plano'
  },
  maxProducts: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número máximo de produtos permitidos'
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número máximo de usuários permitidos'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Marcar como plano recomendado'
  },
  trialDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Dias de trial gratuito'
  }
}, {
  tableName: 'plans',
  timestamps: true,
  underscored: true
});

module.exports = Plan;
