const { sequelize } = require('./src/config/database');

async function run() {
  await sequelize.authenticate();
  
  const [tenants] = await sequelize.query('SELECT DISTINCT tenant_id FROM configuracoes');
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
      const [existing] = await sequelize.query(
        `SELECT id FROM configuracoes WHERE chave = '${cfg.chave}' AND tenant_id = '${tenantId}'`
      );
      if (existing.length === 0) {
        await sequelize.query(
          `INSERT INTO configuracoes (id, chave, valor, tipo, descricao, tenant_id, criado_em, atualizado_em)
           VALUES (gen_random_uuid(), '${cfg.chave}', '${cfg.valor}', '${cfg.tipo}', '${cfg.descricao}', '${tenantId}', NOW(), NOW())`
        );
        console.log(`✅ Inserido "${cfg.chave}" para tenant "${tenantId}"`);
      } else {
        console.log(`⏭️  "${cfg.chave}" já existe para tenant "${tenantId}"`);
      }
    }
  }

  console.log('Concluído!');
  process.exit(0);
}

run().catch(e => { console.error('Erro:', e.message); process.exit(1); });
