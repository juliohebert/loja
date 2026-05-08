const { sequelize } = require('./src/config/database');
async function run() {
  await sequelize.authenticate();
  const [rows, meta] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Rows:', JSON.stringify(rows, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
