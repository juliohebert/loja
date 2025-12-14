const { sequelize } = require('./src/config/database');
const Schema = require('./src/models/Schema');

async function syncDatabase() {
  try {
    console.log('🔄 Sincronizando banco de dados com Neon...');
    
    // Sincronizar todos os modelos sem alterar tabelas existentes
    await sequelize.sync({ force: false });
    
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('📋 Modelos sincronizados:');
    console.log('   - Users (Usuários)');
    console.log('   - MasterStores (Lojas Master)');
    console.log('   - Configurations (Configurações)');
    console.log('   - Products (Produtos)');
    console.log('   - Variations (Variações)');
    console.log('   - Stock (Estoque)');
    console.log('   - Sales (Vendas)');
    console.log('   - Customers (Clientes)');
    console.log('   - CustomerTransactions (Transações)');
    console.log('   - CashRegisters (Caixas)');
    console.log('   - Suppliers (Fornecedores)');
    console.log('   - PurchaseOrders (Pedidos de Compra)');
    console.log('   - AccountPayable (Contas a Pagar)');
    console.log('   - AccountReceivable (Contas a Receber)');
    console.log('   - Subscriptions (Assinaturas)');
    console.log('   - Plans (Planos)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco:', error);
    process.exit(1);
  }
}

syncDatabase();
