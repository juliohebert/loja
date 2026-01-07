'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pedidos_catalogo', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero_pedido: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Número único do pedido'
      },
      cliente_nome: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Nome completo do cliente'
      },
      cliente_telefone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Telefone/WhatsApp do cliente'
      },
      cliente_email: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Email do cliente'
      },
      cliente_endereco: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Endereço completo do cliente'
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array de itens do pedido'
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Subtotal antes de descontos'
      },
      desconto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Valor total de desconto'
      },
      valor_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Valor total do pedido'
      },
      status: {
        type: Sequelize.ENUM('novo', 'processando', 'separacao', 'enviado', 'entregue', 'cancelado'),
        allowNull: false,
        defaultValue: 'novo',
        comment: 'Status atual do pedido'
      },
      origem: {
        type: Sequelize.ENUM('whatsapp', 'catalogo', 'loja_fisica'),
        allowNull: false,
        defaultValue: 'catalogo',
        comment: 'Canal de origem do pedido'
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Observações adicionais'
      },
      tenant_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'default',
        comment: 'ID do tenant'
      },
      criado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('pedidos_catalogo', ['tenant_id'], {
      name: 'pedidos_catalogo_tenant_id_idx'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['status'], {
      name: 'pedidos_catalogo_status_idx'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['numero_pedido'], {
      name: 'pedidos_catalogo_numero_pedido_idx'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['cliente_telefone'], {
      name: 'pedidos_catalogo_cliente_telefone_idx'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['criado_em'], {
      name: 'pedidos_catalogo_criado_em_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pedidos_catalogo');
  }
};
