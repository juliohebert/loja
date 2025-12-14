'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar novo tipo ao ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_transacoes_clientes_tipo" ADD VALUE IF NOT EXISTS 'usar-credito';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Não é possível remover valores de ENUM diretamente no PostgreSQL
    // Esta migration não tem rollback
    console.log('Rollback não disponível para remoção de valores de ENUM');
  }
};
