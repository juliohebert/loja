const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loja = sequelize.define('Loja', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cnpj: {
    type: DataTypes.STRING(18),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'lojas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = Loja;
