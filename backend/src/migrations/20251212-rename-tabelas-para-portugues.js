module.exports = {
  up: async (queryInterface) => {
    // Renomear tabelas para português
    await queryInterface.renameTable('accounts_receivable', 'contas_receber');
    await queryInterface.renameTable('purchase_orders', 'pedidos_compra');
    await queryInterface.renameTable('suppliers', 'fornecedores');
  },

  down: async (queryInterface) => {
    // Reverter nomes das tabelas para inglês
    await queryInterface.renameTable('contas_receber', 'accounts_receivable');
    await queryInterface.renameTable('pedidos_compra', 'purchase_orders');
    await queryInterface.renameTable('fornecedores', 'suppliers');
  },
};
