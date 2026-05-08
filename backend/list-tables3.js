const { sequelize } = require('./src/config/database');
async function run() {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  console.log('Tabelas:', tables);
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
