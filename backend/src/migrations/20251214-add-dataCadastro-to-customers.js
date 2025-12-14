"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Adiciona a coluna permitindo NULL
    await queryInterface.addColumn("clientes", "dataCadastro", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    // 2. Atualiza registros antigos com a data atual
    await queryInterface.sequelize.query(
      `UPDATE "clientes" SET "dataCadastro" = CURRENT_DATE WHERE "dataCadastro" IS NULL;`
    );
    // 3. Altera a coluna para NOT NULL
    await queryInterface.changeColumn("clientes", "dataCadastro", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("clientes", "dataCadastro");
  },
};
