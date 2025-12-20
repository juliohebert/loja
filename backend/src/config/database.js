const { Sequelize } = require('sequelize');

/**
 * Configuração da conexão com PostgreSQL usando Sequelize
 * Suporta DATABASE_URL (produção) ou variáveis individuais (desenvolvimento)
 */

// Usar DATABASE_URL se disponível (produção), senão usar variáveis individuais
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Necessário para Render/Neon
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
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

// Adicionar log para depurar conexão com o banco de dados
console.log('Tentando conectar ao banco de dados:', process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'loja_roupas',
  user: process.env.DB_USER || 'postgres'
});

// Adicionar log para verificar se DATABASE_URL está sendo lida corretamente
console.log('Valor de DATABASE_URL:', process.env.DATABASE_URL);

// Adicionar validação para garantir que DATABASE_URL e DB_PASSWORD sejam strings válidas
if (process.env.DATABASE_URL && typeof process.env.DATABASE_URL !== 'string') {
  throw new Error('DATABASE_URL deve ser uma string válida. Valor atual: ' + process.env.DATABASE_URL);
}

if (!process.env.DATABASE_URL && typeof process.env.DB_PASSWORD !== 'string') {
  throw new Error('DB_PASSWORD deve ser uma string válida. Valor atual: ' + process.env.DB_PASSWORD);
}

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
