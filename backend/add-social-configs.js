// Script para adicionar campos instagram_usuario e telefone_whatsapp no banco
const { sequelize } = require('./src/config/database');

async function run() {
  await sequelize.authenticate();
  console.log('Conectado!');

  // Descobrir nome real da tabela de configurações
  const [tables] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%config%'"
  );
  console.log('Tabelas config:', tables.map(t => t.table_name));

  // Descobrir tenants existentes
  const tableName = tables[0]?.table_name;
  if (!tableName) {
    console.error('Tabela de configurações não encontrada!');
    process.exit(1);
  }

  const [tenants] = await sequelize.query(`SELECT DISTINCT tenant_id FROM "${tableName}"`);
  console.log('Tenants:', tenants.map(t => t.tenant_id));

  const newConfigs = [
    {
      chave: 'telefone_whatsapp',
      valor: '',
      tipo: 'texto',
      descricao: 'Número do WhatsApp para contato (exibido no catálogo público)'
    },
    {
      chave: 'instagram_usuario',
      valor: '',
      tipo: 'texto',
      descricao: 'Usuário do Instagram da loja (exibido no catálogo público)'
    }
  ];

  for (const tenant of tenants) {
    const tenantId = tenant.tenant_id;
    for (const cfg of newConfigs) {
      // Verificar se já existe
      const [existing] = await sequelize.query(
        `SELECT id FROM "${tableName}" WHERE chave = '${cfg.chave}' AND tenant_id = '${tenantId}'`
      );
      if (existing.length === 0) {
        await sequelize.query(
          `INSERT INTO "${tableName}" (chave, valor, tipo, descricao, tenant_id, "createdAt", "updatedAt")
           VALUES ('${cfg.chave}', '${cfg.valor}', '${cfg.tipo}', '${cfg.descricao}', '${tenantId}', NOW(), NOW())`
        );
        console.log(`✅ Inserido ${cfg.chave} para tenant ${tenantId}`);
      } else {
        console.log(`⏭️  ${cfg.chave} já existe para tenant ${tenantId}`);
      }
    }
  }

  process.exit(0);
}

run().catch(e => {
  console.error('Erro:', e.message);
  process.exit(1);
});
