const { sequelize } = require('./src/config/database');

async function addCancelFields() {
  try {
    console.log('🔄 Adicionando colunas de cancelamento à tabela vendas...');
    
    await sequelize.query(`
      ALTER TABLE vendas 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado')),
      ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
      ADD COLUMN IF NOT EXISTS cancelado_por UUID REFERENCES usuarios(id),
      ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMP;
    `);
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Verificar se as colunas foram criadas
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'vendas' 
      AND column_name IN ('status', 'motivo_cancelamento', 'cancelado_por', 'cancelado_em')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Colunas criadas:');
    console.table(results);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

addCancelFields();
