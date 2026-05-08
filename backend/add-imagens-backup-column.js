/**
 * Migration: Adicionar coluna imagens_backup na tabela produtos
 * 
 * Esta coluna armazena thumbnails em base64 como backup de segurança
 * das imagens hospedadas no Cloudinary.
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('produtos', 'imagens_backup', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Backup em thumbnail base64 das imagens (segurança caso Cloudinary falhe)'
    });
    
    console.log('✅ Coluna imagens_backup adicionada com sucesso!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('produtos', 'imagens_backup');
    console.log('✅ Coluna imagens_backup removida com sucesso!');
  }
};
