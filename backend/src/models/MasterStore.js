const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterStore = sequelize.define('MasterStore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nomeLoja: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cnpj: {
    type: DataTypes.STRING
  },
  telefone: {
    type: DataTypes.STRING
  },
  endereco: {
    type: DataTypes.STRING
  },
  responsavel: {
    type: DataTypes.STRING
  },
  plano: {
    type: DataTypes.STRING
  },
  dbName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'lojas_master',
  timestamps: true
});

module.exports = MasterStore;
