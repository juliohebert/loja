// Migration para adicionar configuração de slug do catálogo
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Adicionar coluna slug_catalogo na tabela configuracoes
      await queryInterface.addColumn(
        'configuracoes',
        'slug_catalogo',
        {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: false,
          comment: 'Slug único para identificar o catálogo da loja nas URLs públicas'
        },
        { transaction }
      );

      // Criar índice para busca rápida por slug
      await queryInterface.addIndex(
        'configuracoes',
        ['slug_catalogo'],
        {
          name: 'idx_configuracoes_slug_catalogo',
          transaction
        }
      );

      console.log('✅ Coluna slug_catalogo adicionada à tabela configuracoes');
      console.log('✅ Índice idx_configuracoes_slug_catalogo criado');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remover índice
      await queryInterface.removeIndex(
        'configuracoes',
        'idx_configuracoes_slug_catalogo',
        { transaction }
      );

      // Remover coluna
      await queryInterface.removeColumn(
        'configuracoes',
        'slug_catalogo',
        { transaction }
      );

      console.log('✅ Coluna slug_catalogo removida');
      console.log('✅ Índice removido');
    });
  }
};
