/**
 * Migration: Adicionar campo exibir_catalogo em produtos
 * Controla quais produtos aparecem no catálogo público
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('produtos', 'exibir_catalogo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Define se o produto deve aparecer no catálogo público'
    });

    // Criar índice para melhorar performance das queries do catálogo
    await queryInterface.addIndex('produtos', ['exibir_catalogo'], {
      name: 'idx_produtos_exibir_catalogo'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('produtos', 'idx_produtos_exibir_catalogo');
    await queryInterface.removeColumn('produtos', 'exibir_catalogo');
  }
};
