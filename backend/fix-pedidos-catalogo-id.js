require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function fixPedidosCatalogoId() {
  try {
    console.log('🔧 Corrigindo coluna ID da tabela pedidos_catalogo...\n');

    // Drop a tabela se existir
    await sequelize.query('DROP TABLE IF EXISTS pedidos_catalogo CASCADE;');
    console.log('✅ Tabela antiga removida');

    // Recriar com SERIAL
    await sequelize.query(`
      CREATE TABLE pedidos_catalogo (
        id SERIAL PRIMARY KEY,
        numero_pedido VARCHAR(20) NOT NULL UNIQUE,
        cliente_nome VARCHAR(200) NOT NULL,
        cliente_telefone VARCHAR(20) NOT NULL,
        cliente_email VARCHAR(200),
        cliente_endereco TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        desconto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) NOT NULL DEFAULT 'novo',
        origem VARCHAR(20) NOT NULL DEFAULT 'catalogo',
        observacoes TEXT,
        tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
        criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela recriada com SERIAL');

    // Criar índices
    await sequelize.query('CREATE INDEX idx_pedidos_catalogo_tenant ON pedidos_catalogo(tenant_id);');
    await sequelize.query('CREATE INDEX idx_pedidos_catalogo_status ON pedidos_catalogo(status);');
    await sequelize.query('CREATE INDEX idx_pedidos_catalogo_numero ON pedidos_catalogo(numero_pedido);');
    console.log('✅ Índices criados');

    console.log('\n✅ Correção concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixPedidosCatalogoId();
