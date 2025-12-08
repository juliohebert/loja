const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Model de Usuário
 * Armazena credenciais e informações de acesso ao sistema
 */

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nome',
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'email',
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'senha',
    validate: {
      notEmpty: true
    }
  },
  funcao: {
    type: DataTypes.ENUM('admin', 'vendedor', 'gerente'),
    defaultValue: 'vendedor',
    allowNull: false,
    field: 'funcao'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'ativo'
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'telefone'
  },
  permissoes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'permissoes',
    comment: 'Permissões personalizadas do usuário'
  },
  tokenRecuperacao: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'token_recuperacao'
  },
  tokenRecuperacaoExpira: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'token_recuperacao_expira'
  },
  ultimoLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ultimo_login'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  defaultScope: {
    attributes: { exclude: ['senha', 'tokenRecuperacao', 'tokenRecuperacaoExpira'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['senha'] }
    }
  }
});

module.exports = User;
