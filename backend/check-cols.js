const { sequelize } = require('./src/config/database');

async function run() {
  await sequelize.authenticate();
  
  // Get column names for the configuracoes table
  const [cols] = await sequelize.query(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'configuracoes' ORDER BY ordinal_position"
  );
  console.log('Colunas:', JSON.stringify(cols, null, 2));
  process.exit(0);
}

run().catch(e => { console.error('Erro:', e.message); process.exit(1); });
