/**
 * Script para migrar imagens base64 do banco de dados para Cloudinary
 * 
 * Este script:
 * 1. Busca todos os produtos com imagens em base64
 * 2. Faz upload das imagens para o Cloudinary
 * 3. Atualiza os produtos com as URLs do Cloudinary
 * 4. Remove as imagens base64 do banco
 * 
 * IMPORTANTE: Configure as variáveis de ambiente do Cloudinary antes de executar!
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { Product } = require('./src/models/Schema');

async function migrarImagensParaCloudinary() {
  console.log('🚀 Iniciando migração de imagens para Cloudinary...\n');

  try {
    // 1. Buscar todos os produtos que têm imagens
    const produtos = await Product.findAll({
      where: {
        imagens: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    console.log(`📊 Encontrados ${produtos.length} produtos com imagens\n`);

    let migrados = 0;
    let erros = 0;
    let semBase64 = 0;

    for (const produto of produtos) {
      try {
        const imagens = produto.imagens;
        
        if (!Array.isArray(imagens) || imagens.length === 0) {
          continue;
        }

        console.log(`📦 Processando: ${produto.nome} (${imagens.length} imagens)`);

        const novasUrls = [];
        let imagensBase64 = 0;

        for (let i = 0; i < imagens.length; i++) {
          const imagem = imagens[i];

          // Verificar se é base64
          if (typeof imagem === 'string' && imagem.startsWith('data:image')) {
            imagensBase64++;
            
            try {
              console.log(`  📤 Fazendo upload da imagem ${i + 1}...`);

              // Upload para Cloudinary
              const result = await cloudinary.uploader.upload(imagem, {
                folder: 'loja-produtos-migrados',
                resource_type: 'image',
                transformation: [
                  { width: 1000, height: 1000, crop: 'limit' },
                  { quality: 'auto:good' }
                ]
              });

              novasUrls.push(result.secure_url);
              console.log(`  ✅ Upload concluído: ${result.secure_url.substring(0, 60)}...`);

            } catch (uploadError) {
              console.error(`  ❌ Erro no upload da imagem ${i + 1}:`, uploadError.message);
              // Se falhar, manter a imagem original
              novasUrls.push(imagem);
            }
          } else {
            // Já é uma URL ou outro formato, manter como está
            novasUrls.push(imagem);
          }
        }

        // Atualizar produto se houver imagens migradas
        if (imagensBase64 > 0) {
          await produto.update({ imagens: novasUrls });
          migrados++;
          console.log(`  ✨ Produto atualizado com ${imagensBase64} imagens migradas\n`);
        } else {
          semBase64++;
          console.log(`  ℹ️  Produto já usa URLs (não precisa migrar)\n`);
        }

      } catch (erro) {
        erros++;
        console.error(`  ❌ Erro ao processar produto ${produto.nome}:`, erro.message, '\n');
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Produtos migrados com sucesso: ${migrados}`);
    console.log(`ℹ️  Produtos que já usavam URLs: ${semBase64}`);
    console.log(`❌ Erros durante migração: ${erros}`);
    console.log(`📦 Total processado: ${produtos.length}`);
    console.log('='.repeat(60));

    if (migrados > 0) {
      console.log('\n💾 Economia estimada no banco de dados:');
      console.log(`   ~${(migrados * 1.5).toFixed(1)}MB liberados (estimativa)`);
    }

    console.log('\n✨ Migração concluída!');

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  // Verificar se as credenciais do Cloudinary estão configuradas
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERRO: Credenciais do Cloudinary não configuradas!');
    console.error('Configure as seguintes variáveis de ambiente:');
    console.error('  - CLOUDINARY_CLOUD_NAME');
    console.error('  - CLOUDINARY_API_KEY');
    console.error('  - CLOUDINARY_API_SECRET');
    console.error('\nCrie uma conta gratuita em: https://cloudinary.com/');
    process.exit(1);
  }

  migrarImagensParaCloudinary()
    .then(() => {
      console.log('\n👋 Saindo...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

module.exports = { migrarImagensParaCloudinary };
