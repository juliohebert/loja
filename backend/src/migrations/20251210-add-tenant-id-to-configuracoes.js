module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('configuracoes', 'tenantId', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('configuracoes', 'tenantId');
  },
};