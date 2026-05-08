'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('pedidos_catalogo');

    if (!tableDesc.tipo_entrega) {
      await queryInterface.addColumn('pedidos_catalogo', 'tipo_entrega', {
        type: Sequelize.ENUM('retirada', 'entrega'),
        allowNull: true,
        defaultValue: 'retirada'
      });
    }

    if (!tableDesc.forma_pagamento) {
      await queryInterface.addColumn('pedidos_catalogo', 'forma_pagamento', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('pedidos_catalogo', 'tipo_entrega');
    await queryInterface.removeColumn('pedidos_catalogo', 'forma_pagamento');
  }
};
