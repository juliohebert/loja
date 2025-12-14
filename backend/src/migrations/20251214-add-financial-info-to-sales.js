'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('vendas', 'credito_utilizado', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor de crédito utilizado pelo cliente nesta venda'
    });

    await queryInterface.addColumn('vendas', 'debito_pago', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor de débito pendente pago junto com esta venda'
    });

    await queryInterface.addColumn('vendas', 'tipo_desconto', {
      type: Sequelize.ENUM('valor', 'percentual'),
      allowNull: true,
      comment: 'Tipo de desconto aplicado: valor fixo ou percentual'
    });

    await queryInterface.addColumn('vendas', 'valor_desconto_original', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Valor original do desconto informado (antes do cálculo)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('vendas', 'credito_utilizado');
    await queryInterface.removeColumn('vendas', 'debito_pago');
    await queryInterface.removeColumn('vendas', 'tipo_desconto');
    await queryInterface.removeColumn('vendas', 'valor_desconto_original');
  }
};
