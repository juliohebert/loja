const { sequelize } = require('./src/config/database');
const ContaPagar = require('./src/models/AccountPayable');
const ContaReceber = require('./src/models/AccountReceivable');

async function createTestAccounts() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    const tenantId = 'tenant_loja_3tec_1765500122876';

    // Criar contas a pagar de teste
    const contasPagar = await ContaPagar.bulkCreate([
      {
        descricao: 'Aluguel da loja - Dezembro',
        categoria: 'Aluguel',
        valor: 2000.00,
        valorPago: 0,
        dataEmissao: '2025-12-01',
        dataVencimento: '2025-12-10',
        status: 'vencido',
        tenant_id: tenantId,
        ativo: true
      },
      {
        descricao: 'Energia elétrica',
        categoria: 'Utilidades',
        valor: 350.50,
        valorPago: 0,
        dataEmissao: '2025-12-05',
        dataVencimento: '2025-12-20',
        status: 'pendente',
        tenant_id: tenantId,
        ativo: true
      },
      {
        descricao: 'Internet e telefone',
        categoria: 'Comunicação',
        valor: 150.00,
        valorPago: 150.00,
        dataEmissao: '2025-12-01',
        dataVencimento: '2025-12-05',
        dataPagamento: '2025-12-05',
        status: 'pago',
        formaPagamento: 'Débito automático',
        tenant_id: tenantId,
        ativo: true
      }
    ]);

    console.log(`✅ Criadas ${contasPagar.length} contas a pagar`);

    // Criar contas a receber de teste
    const contasReceber = await ContaReceber.bulkCreate([
      {
        descricao: 'Venda parcelada - João Silva',
        clienteNome: 'João Silva',
        clienteCpfCnpj: '123.456.789-00',
        clienteTelefone: '(11) 99999-8888',
        valor: 500.00,
        valorRecebido: 0,
        dataEmissao: '2025-12-01',
        dataVencimento: '2025-12-15',
        status: 'pendente',
        numeroParcela: 1,
        totalParcelas: 3,
        tenant_id: tenantId,
        ativo: true
      },
      {
        descricao: 'Venda parcelada - Maria Santos',
        clienteNome: 'Maria Santos',
        clienteCpfCnpj: '987.654.321-00',
        clienteTelefone: '(11) 98888-7777',
        valor: 750.00,
        valorRecebido: 750.00,
        dataEmissao: '2025-12-05',
        dataVencimento: '2025-12-10',
        dataRecebimento: '2025-12-10',
        status: 'recebido',
        formaPagamento: 'PIX',
        tenant_id: tenantId,
        ativo: true
      },
      {
        descricao: 'Venda a prazo - Pedro Costa',
        clienteNome: 'Pedro Costa',
        clienteCpfCnpj: '456.789.123-00',
        valor: 1200.00,
        valorRecebido: 0,
        dataEmissao: '2025-11-20',
        dataVencimento: '2025-12-05',
        status: 'vencido',
        tenant_id: tenantId,
        ativo: true
      }
    ]);

    console.log(`✅ Criadas ${contasReceber.length} contas a receber`);
    console.log('\n📊 Resumo:');
    console.log(`   - ${contasPagar.length} contas a pagar`);
    console.log(`   - ${contasReceber.length} contas a receber`);
    console.log('\n✅ Dados de teste criados com sucesso!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar contas de teste:', error);
    process.exit(1);
  }
}

createTestAccounts();
