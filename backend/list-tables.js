const { sequelize } = require('./src/config/database');
async function run() {
  await sequelize.authenticate();
  const [tables] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
  );
  console.log(tables.map(t => JSON.stringify(t)).join('\n'));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
