const { sequelize } = require('./src/config/database');

async function fixConstraint() {
  try {
    console.log('🔧 Removendo constraint antiga...');
    
    // Remove a constraint UNIQUE antiga (somente numero_pedido)
    await sequelize.query(`
      ALTER TABLE pedidos_catalogo 
      DROP CONSTRAINT IF EXISTS pedidos_catalogo_numero_pedido_key;
    `);
    
    console.log('✅ Constraint antiga removida');
    
    console.log('🔧 Criando nova constraint (tenant_id + numero_pedido)...');
    
    // Cria constraint UNIQUE composta (tenant_id + numero_pedido)
    await sequelize.query(`
      ALTER TABLE pedidos_catalogo 
      ADD CONSTRAINT pedidos_catalogo_tenant_numero_unique 
      UNIQUE (tenant_id, numero_pedido);
    `);
    
    console.log('✅ Nova constraint criada com sucesso!');
    console.log('✅ Agora cada tenant pode ter seu próprio #0001, #0002, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao ajustar constraint:', error);
    process.exit(1);
  }
}

fixConstraint();
