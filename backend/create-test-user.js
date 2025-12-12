const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'loja_roupas',
  password: 'postgres',
  port: 5432,
});

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    const tenantId = 'tenant_loja_3tec_1765500122876';
    
    const result = await pool.query(`
      INSERT INTO usuarios (id, nome, email, senha, funcao, ativo, tenant_id, criado_em, atualizado_em)
      VALUES (
        gen_random_uuid(),
        'Teste Loja 10',
        'loja10@email.com',
        $1,
        'admin',
        true,
        $2,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
      SET senha = $1, tenant_id = $2
      RETURNING id, nome, email, tenant_id;
    `, [hashedPassword, tenantId]);

    console.log('✅ Usuário criado/atualizado:', result.rows[0]);
    
    await pool.end();
    console.log('✅ Script finalizado!');
  } catch (error) {
    console.error('❌ Erro:', error);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
