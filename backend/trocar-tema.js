/**
 * Script para trocar tema de uma loja via terminal
 * Uso: node trocar-tema.js <tenant_id> <tema_id>
 *
 * Temas: padrao | rosaElegante
 * Exemplo: node trocar-tema.js tenant_minha_loja_1777338117268 rosaElegante
 */

require('dotenv').config();
const { Client } = require('pg');

const TEMAS = {
  padrao:       'Azul Profissional',
  rosaElegante: 'Rosa Elegante'
};

async function trocarTema() {
  const [, , tenantId, temaId] = process.argv;

  if (!tenantId || !temaId) {
    console.log('\nUso: node trocar-tema.js <tenant_id> <tema_id>');
    console.log('\nTemas disponíveis:');
    Object.entries(TEMAS).forEach(([id, nome]) => console.log(`  ${id.padEnd(16)} → ${nome}`));
    process.exit(1);
  }

  if (!TEMAS[temaId]) {
    console.log(`\nTema inválido: "${temaId}"`);
    console.log('Opções:', Object.keys(TEMAS).join(', '));
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Conectado ao banco');

  try {
    const { rows } = await client.query(
      `SELECT id FROM configuracoes WHERE chave = 'tema_selecionado' AND tenant_id = $1`,
      [tenantId]
    );

    if (rows.length > 0) {
      await client.query(
        `UPDATE configuracoes SET valor = $1, atualizado_em = NOW()
         WHERE chave = 'tema_selecionado' AND tenant_id = $2`,
        [temaId, tenantId]
      );
    } else {
      await client.query(
        `INSERT INTO configuracoes (id, chave, valor, tipo, descricao, tenant_id, criado_em, atualizado_em)
         VALUES (gen_random_uuid(), 'tema_selecionado', $1, 'texto', 'Tema visual', $2, NOW(), NOW())`,
        [temaId, tenantId]
      );
    }

    console.log(`\n🎨 Tema aplicado: ${TEMAS[temaId]} (${temaId})`);
    console.log(`📌 Tenant: ${tenantId}`);
    console.log('🔄 Recarregue a página para ver as mudanças (Ctrl+Shift+R).\n');
  } finally {
    await client.end();
  }
}

trocarTema().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
