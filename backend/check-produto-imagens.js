/**
 * Script para verificar produto recém-criado e suas imagens
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function checkProduct() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando produto mais recente...\n');
    
    // Buscar produto mais recente do tenant
    const result = await client.query(`
      SELECT 
        id, 
        nome, 
        descricao,
        marca,
        categoria,
        preco_venda,
        imagens,
        imagens_backup,
        ativo,
        exibir_catalogo,
        criado_em
      FROM produtos 
      WHERE tenant_id = 'tenant_minha_loja_1777338117268'
      ORDER BY criado_em DESC 
      LIMIT 1;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }
    
    const produto = result.rows[0];
    console.log('✅ Produto encontrado:\n');
    console.log(`📦 Nome: ${produto.nome}`);
    console.log(`🆔 ID: ${produto.id}`);
    console.log(`💰 Preço: R$ ${produto.preco_venda}`);
    console.log(`🏷️ Categoria: ${produto.categoria || 'N/A'}`);
    console.log(`🏭 Marca: ${produto.marca || 'N/A'}`);
    console.log(`✅ Ativo: ${produto.ativo}`);
    console.log(`👁️ Exibir no catálogo: ${produto.exibir_catalogo}`);
    console.log(`📅 Criado em: ${produto.criado_em}`);
    console.log('\n📸 IMAGENS:');
    
    if (produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0) {
      console.log(`✅ Quantidade de imagens: ${produto.imagens.length}`);
      produto.imagens.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.substring(0, 80)}...`);
        // Verificar se é URL do Cloudinary
        if (img.includes('cloudinary.com')) {
          console.log(`      ☁️ CLOUDINARY - OK!`);
        } else if (img.startsWith('data:image')) {
          console.log(`      ⚠️ BASE64 - AINDA NÃO MIGRADO`);
        } else {
          console.log(`      ❓ FORMATO DESCONHECIDO`);
        }
      });
    } else {
      console.log('❌ Nenhuma imagem encontrada no campo "imagens"');
    }
    
    console.log('\n💾 BACKUP DE IMAGENS:');
    if (produto.imagens_backup && Array.isArray(produto.imagens_backup) && produto.imagens_backup.length > 0) {
      console.log(`✅ Quantidade de backups: ${produto.imagens_backup.length}`);
      produto.imagens_backup.forEach((backup, index) => {
        const tamanho = backup ? Math.round(backup.length / 1024) : 0;
        console.log(`   ${index + 1}. Thumbnail base64 (~${tamanho}KB)`);
      });
    } else {
      console.log('❌ Nenhum backup encontrado no campo "imagens_backup"');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkProduct()
  .then(() => {
    console.log('\n✨ Verificação concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Falha na verificação:', error);
    process.exit(1);
  });
