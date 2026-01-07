/**
 * Script para executar migration: criar tabela pedidos_catalogo
 */

require('dotenv').config();
const { sequelize } = require('./src/models/Schema');
const { QueryInterface } = require('sequelize');

const runMigration = async () => {
  try {
    console.log('🚀 Iniciando migration: create-pedidos-catalogo');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Verificar se a tabela já existe
    const tables = await queryInterface.showAllTables();
    if (tables.includes('pedidos_catalogo')) {
      console.log('⚠️  Tabela pedidos_catalogo já existe. Pulando migration.');
      process.exit(0);
    }

    // Criar tabela pedidos_catalogo
    await queryInterface.createTable('pedidos_catalogo', {
      id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      numero_pedido: {
        type: sequelize.Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      cliente_nome: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false
      },
      cliente_telefone: {
        type: sequelize.Sequelize.STRING(20),
        allowNull: false
      },
      cliente_email: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      cliente_endereco: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      items: {
        type: sequelize.Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      subtotal: {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      desconto: {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      valor_total: {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: sequelize.Sequelize.ENUM(
          'novo',
          'processando',
          'separacao',
          'enviado',
          'entregue',
          'cancelado'
        ),
        allowNull: false,
        defaultValue: 'novo'
      },
      origem: {
        type: sequelize.Sequelize.ENUM(
          'catalogo',
          'whatsapp',
          'loja_fisica'
        ),
        allowNull: false,
        defaultValue: 'catalogo'
      },
      observacoes: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      tenant_id: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'default'
      },
      criado_em: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      atualizado_em: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      }
    });

    console.log('✅ Tabela pedidos_catalogo criada com sucesso');

    // Criar índices
    await queryInterface.addIndex('pedidos_catalogo', ['tenant_id'], {
      name: 'idx_pedidos_catalogo_tenant_id'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['status'], {
      name: 'idx_pedidos_catalogo_status'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['numero_pedido'], {
      name: 'idx_pedidos_catalogo_numero_pedido'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['cliente_telefone'], {
      name: 'idx_pedidos_catalogo_cliente_telefone'
    });
    
    await queryInterface.addIndex('pedidos_catalogo', ['criado_em'], {
      name: 'idx_pedidos_catalogo_criado_em'
    });

    console.log('✅ Índices criados com sucesso');
    console.log('✨ Migration concluída!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runMigration();
