const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nomeFantasia: {
    type: DataTypes.STRING
  },
  cnpj: {
    type: DataTypes.STRING(18),
    unique: true
  },
  cpf: {
    type: DataTypes.STRING(14),
    unique: true
  },
  email: {
    type: DataTypes.STRING
  },
  telefone: {
    type: DataTypes.STRING
  },
  celular: {
    type: DataTypes.STRING
  },
  endereco: {
    type: DataTypes.STRING
  },
  numero: {
    type: DataTypes.STRING
  },
  complemento: {
    type: DataTypes.STRING
  },
  bairro: {
    type: DataTypes.STRING
  },
  cidade: {
    type: DataTypes.STRING
  },
  estado: {
    type: DataTypes.STRING(2)
  },
  cep: {
    type: DataTypes.STRING(9)
  },
  prazoEntregaDias: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  condicoesPagamento: {
    type: DataTypes.TEXT
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avaliacaoQualidade: {
    type: DataTypes.INTEGER, // 1 a 5 estrelas
    defaultValue: 0
  },
  avaliacaoPontualidade: {
    type: DataTypes.INTEGER, // 1 a 5 estrelas
    defaultValue: 0
  },
  tenant_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'tenant_id',
    comment: 'ID do tenant para isolamento multitenancy'
  }
}, {
  tableName: 'fornecedores',
  timestamps: true
});

module.exports = Supplier;
