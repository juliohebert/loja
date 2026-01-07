require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function limparPedidosTeste() {
  try {
    console.log('🔧 Conectando ao banco...');
    await sequelize.authenticate();
    console.log('✅ Conectado!');
    
    console.log('🗑️  Deletando todos os pedidos de teste...');
    await sequelize.query(`DELETE FROM pedidos_catalogo;`);
    console.log('✅ Pedidos deletados!');
    
    console.log('🔧 Removendo constraint antiga (global)...');
    await sequelize.query(`
      ALTER TABLE pedidos_catalogo 
      DROP CONSTRAINT IF EXISTS pedidos_catalogo_numero_pedido_key;
    `);
    console.log('✅ Constraint global removida!');
    
    console.log('🔧 Criando constraint composta (tenant_id + numero_pedido)...');
    await sequelize.query(`
      ALTER TABLE pedidos_catalogo 
      ADD CONSTRAINT pedidos_catalogo_tenant_numero_unique 
      UNIQUE (tenant_id, numero_pedido);
    `);
    console.log('✅ Constraint composta criada!');
    
    console.log('');
    console.log('✨ PRONTO! Agora cada tenant pode ter:');
    console.log('   - Loja A: #0001, #0002, #0003...');
    console.log('   - Loja B: #0001, #0002, #0003...');
    console.log('   - Loja C: #0001, #0002, #0003...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

limparPedidosTeste();
