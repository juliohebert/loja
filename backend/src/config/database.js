const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Configuração da conexão com PostgreSQL usando Sequelize
 * Variáveis de ambiente devem estar definidas no arquivo .env
 */

const sequelize = new Sequelize(
  process.env.DB_NAME || 'loja_roupas',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Função para criar uma nova conexão com o banco de dados dinamicamente
const createTenantDatabase = (dbName) => {
  return new Sequelize(dbName, process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
};

// Teste de conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
  }
};

testConnection();

module.exports = { sequelize, createTenantDatabase };
