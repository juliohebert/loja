/**
 * Script para limpar dados do banco de dados
 * ATENÇÃO: Este script remove TODOS os dados de produção!
 * Use apenas quando quiser resetar o sistema para começar do zero.
 */

const { sequelize } = require('./src/models/Schema');

async function resetDatabase() {
  console.log('🚨 ATENÇÃO: Este script vai APAGAR TODOS OS DADOS!');
  console.log('⏳ Aguardando 5 segundos... Pressione Ctrl+C para cancelar.\n');
  
  // Aguardar 5 segundos para dar chance de cancelar
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conectado!\n');

    // Desabilitar verificação de chave estrangeira temporariamente
    await sequelize.query('SET session_replication_role = replica;');

    console.log('🗑️  Limpando dados...\n');

    // 1. Limpar vendas e itens de venda
    console.log('📦 Removendo itens de venda...');
    await sequelize.query('DELETE FROM itens_venda;');
    
    console.log('💰 Removendo vendas...');
    await sequelize.query('DELETE FROM vendas;');

    // 2. Limpar estoque e variações
    console.log('📊 Removendo estoque...');
    await sequelize.query('DELETE FROM estoques;');
    
    console.log('🎨 Removendo variações de produtos...');
    await sequelize.query('DELETE FROM variacoes;');
    
    console.log('📦 Removendo produtos...');
    await sequelize.query('DELETE FROM produtos;');

    // 3. Limpar fornecedores e ordens de compra
    console.log('📋 Removendo itens de ordens de compra...');
    await sequelize.query('DELETE FROM itens_ordem_compra;');
    
    console.log('🛒 Removendo ordens de compra...');
    await sequelize.query('DELETE FROM ordens_compra;');
    
    console.log('🏭 Removendo fornecedores...');
    await sequelize.query('DELETE FROM fornecedores;');

    // 4. Limpar contas a pagar e receber
    console.log('💳 Removendo contas a pagar...');
    await sequelize.query('DELETE FROM contas_pagar;');
    
    console.log('💵 Removendo contas a receber...');
    await sequelize.query('DELETE FROM contas_receber;');

    // 5. Limpar clientes
    console.log('👥 Removendo clientes...');
    await sequelize.query('DELETE FROM clientes;');

    // 6. Limpar caixas
    console.log('💼 Removendo registros de caixa...');
    await sequelize.query('DELETE FROM caixas;');

    // 7. Limpar usuários (OPCIONAL - descomente se quiser remover usuários também)
    // CUIDADO: Isso remove todos os usuários, incluindo admins!
    // console.log('👤 Removendo usuários...');
    // await sequelize.query('DELETE FROM usuarios WHERE funcao != \'super-admin\';');

    // 8. Limpar assinaturas e planos (manter estrutura de planos)
    console.log('📅 Removendo assinaturas...');
    await sequelize.query('DELETE FROM assinaturas;');

    // 9. Resetar sequências (IDs)
    console.log('\n🔄 Resetando sequências de IDs...');
    const tables = [
      'vendas', 'itens_venda', 'produtos', 'variacoes', 'estoques',
      'clientes', 'fornecedores', 'ordens_compra', 'itens_ordem_compra',
      'contas_pagar', 'contas_receber', 'caixas', 'assinaturas'
    ];

    for (const table of tables) {
      try {
        // Tentar resetar a sequência se existir
        await sequelize.query(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'), 
            1, 
            false
          );
        `);
      } catch (err) {
        // Ignorar erro se a tabela não tiver sequência
      }
    }

    // Reabilitar verificação de chave estrangeira
    await sequelize.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Banco de dados limpo com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('   • Vendas removidas');
    console.log('   • Produtos e estoque removidos');
    console.log('   • Clientes removidos');
    console.log('   • Fornecedores removidos');
    console.log('   • Ordens de compra removidas');
    console.log('   • Contas a pagar/receber removidas');
    console.log('   • Caixas removidos');
    console.log('   • Assinaturas removidas');
    console.log('\n🔒 Mantido:');
    console.log('   • Usuários (para manter acesso ao sistema)');
    console.log('   • Configurações');
    console.log('   • Planos');
    console.log('\n💡 Dica: Se quiser remover usuários também, edite o script e descomente a seção de usuários.');

  } catch (error) {
    console.error('\n❌ Erro ao limpar banco de dados:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexão fechada.');
    process.exit(0);
  }
}

// Executar
resetDatabase();
