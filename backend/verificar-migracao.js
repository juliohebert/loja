/**
 * Script de VERIFICAÇÃO PRÉVIA para migração de imagens
 * 
 * Este script APENAS ANALISA os dados, NÃO FAZ NENHUMA MUDANÇA!
 * Use para ver o que será migrado antes de executar a migração real.
 */

require('dotenv').config();
const { Product } = require('./src/models/Schema');

async function verificarMigracao() {
  console.log('🔍 VERIFICAÇÃO PRÉVIA - Nenhuma mudança será feita!\n');
  console.log('='.repeat(70));

  try {
    // Buscar todos os produtos com imagens
    const produtos = await Product.findAll({
      where: {
        imagens: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    console.log(`📊 Total de produtos com imagens: ${produtos.length}\n`);

    let produtosComBase64 = 0;
    let produtosComUrls = 0;
    let totalImagensBase64 = 0;
    let totalImagensUrl = 0;
    let espacoEstimado = 0;

    console.log('📦 ANÁLISE DETALHADA:\n');

    for (const produto of produtos) {
      const imagens = produto.imagens;
      
      if (!Array.isArray(imagens) || imagens.length === 0) {
        continue;
      }

      let imagensBase64Produto = 0;
      let imagensUrlProduto = 0;
      let espacoProduto = 0;

      for (const imagem of imagens) {
        if (typeof imagem === 'string' && imagem.startsWith('data:image')) {
          imagensBase64Produto++;
          totalImagensBase64++;
          // Estimar tamanho (base64 é ~33% maior que o arquivo original)
          espacoProduto += imagem.length / 1024; // KB
        } else if (typeof imagem === 'string' && (imagem.startsWith('http') || imagem.startsWith('https'))) {
          imagensUrlProduto++;
          totalImagensUrl++;
        }
      }

      if (imagensBase64Produto > 0) {
        produtosComBase64++;
        espacoEstimado += espacoProduto;
        
        console.log(`${produtosComBase64}. ${produto.nome}`);
        console.log(`   🆔 ID: ${produto.id}`);
        console.log(`   📸 Imagens base64: ${imagensBase64Produto}`);
        console.log(`   💾 Espaço no banco: ~${Math.round(espacoProduto)}KB`);
        console.log(`   📅 Criado em: ${produto.criado_em}`);
        if (imagensUrlProduto > 0) {
          console.log(`   ℹ️  Também tem ${imagensUrlProduto} imagens em URL (não serão tocadas)`);
        }
        console.log('');
      } else if (imagensUrlProduto > 0) {
        produtosComUrls++;
      }
    }

    // Resumo final
    console.log('='.repeat(70));
    console.log('📊 RESUMO DA ANÁLISE');
    console.log('='.repeat(70));
    console.log(`✅ Produtos que SERÃO MIGRADOS: ${produtosComBase64}`);
    console.log(`   └─ Total de imagens base64: ${totalImagensBase64}`);
    console.log(`   └─ Espaço ocupado: ~${Math.round(espacoEstimado)}KB (~${(espacoEstimado / 1024).toFixed(2)}MB)`);
    console.log('');
    console.log(`ℹ️  Produtos que já usam URLs (não precisam migrar): ${produtosComUrls}`);
    console.log(`   └─ Total de imagens em URL: ${totalImagensUrl}`);
    console.log('');
    console.log(`📦 Total de produtos analisados: ${produtos.length}`);
    console.log('='.repeat(70));

    if (produtosComBase64 > 0) {
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('');
      console.log('1. ✅ Credenciais do Cloudinary já estão configuradas');
      console.log('2. 🔄 Para executar a migração, rode:');
      console.log('');
      console.log('   node migrar-imagens-cloudinary.js');
      console.log('');
      console.log('⚠️  IMPORTANTE: A migração é SEGURA:');
      console.log('   • Se o upload falhar, mantém a imagem original');
      console.log('   • Não apaga nada antes de ter sucesso');
      console.log('   • Você pode migrar novamente se necessário');
      console.log('');
      console.log(`💾 Economia esperada: ~${(espacoEstimado / 1024).toFixed(2)}MB no banco Neon`);
      console.log(`☁️  Espaço usado no Cloudinary: ~${(espacoEstimado * 0.7 / 1024).toFixed(2)}MB (com compressão)`);
    } else {
      console.log('\n✨ Nenhuma migração necessária! Todos os produtos já usam URLs.');
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

verificarMigracao()
  .then(() => {
    console.log('\n✅ Verificação concluída!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  });
