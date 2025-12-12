const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Adicionar tenantId às tabelas existentes
    await queryInterface.addColumn('Users', 'tenantId', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000', // Valor padrão para registros existentes
    });

    await queryInterface.addColumn('Sales', 'tenantId', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000',
    });

    await queryInterface.addColumn('Suppliers', 'tenantId', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000',
    });

    await queryInterface.addColumn('PurchaseOrders', 'tenantId', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000',
    });

    await queryInterface.addColumn('AccountPayables', 'tenantId', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000',
    });
  },

  down: async (queryInterface) => {
    // Remover tenantId das tabelas existentes
    await queryInterface.removeColumn('Users', 'tenantId');
    await queryInterface.removeColumn('Sales', 'tenantId');
    await queryInterface.removeColumn('Suppliers', 'tenantId');
    await queryInterface.removeColumn('PurchaseOrders', 'tenantId');
    await queryInterface.removeColumn('AccountPayables', 'tenantId');
  },
};