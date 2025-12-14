'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar campo ativo na tabela contas_pagar
    await queryInterface.addColumn('contas_pagar', 'ativo', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // Adicionar campo ativo na tabela contas_receber
    await queryInterface.addColumn('contas_receber', 'ativo', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remover campo ativo da tabela contas_pagar
    await queryInterface.removeColumn('contas_pagar', 'ativo');

    // Remover campo ativo da tabela contas_receber
    await queryInterface.removeColumn('contas_receber', 'ativo');
  }
};
