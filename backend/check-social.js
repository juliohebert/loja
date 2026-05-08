const { sequelize } = require('./src/config/database');
async function run() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(
    "SELECT chave, valor, tenant_id FROM configuracoes WHERE chave IN ('telefone_whatsapp','instagram_usuario') ORDER BY tenant_id, chave"
  );
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
