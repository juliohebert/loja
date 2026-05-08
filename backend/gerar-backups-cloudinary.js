/**
 * Script para criar backups de thumbnails das imagens já migradas para Cloudinary
 * 
 * Este script baixa as imagens do Cloudinary, gera thumbnails e salva no banco
 */

require('dotenv').config();
const sharp = require('sharp');
const { Product } = require('./src/models/Schema');

async function gerarBackupsDasImagensMigradas() {
  console.log('🔄 Gerando backups de thumbnails para produtos migrados...\n');

  try {
    // Buscar produtos com imagens do Cloudinary mas sem backup
    const produtos = await Product.findAll();

    let processados = 0;
    let comBackup = 0;
    let backupsGerados = 0;

    for (const produto of produtos) {
      const imagens = produto.imagens;
      const backups = produto.imagens_backup || [];

      if (!Array.isArray(imagens) || imagens.length === 0) {
        continue;
      }

      // Verificar se tem imagens do Cloudinary
      const imagensCloudinary = imagens.filter(img => 
        typeof img === 'string' && img.includes('cloudinary.com')
      );

      if (imagensCloudinary.length === 0) {
        continue;
      }

      // Verificar se já tem backups para todas as imagens
      if (backups.length >= imagens.length) {
        comBackup++;
        continue;
      }

      processados++;
      console.log(`📦 ${produto.nome}`);
      console.log(`   Imagens: ${imagens.length} | Backups existentes: ${backups.length}`);

      const novosBackups = [];

      for (let i = 0; i < imagens.length; i++) {
        const imagem = imagens[i];

        // Se já tem backup neste índice, manter
        if (backups[i]) {
          novosBackups.push(backups[i]);
          continue;
        }

        // Se não é Cloudinary, pular
        if (!imagem.includes('cloudinary.com')) {
          novosBackups.push('');
          continue;
        }

        try {
          console.log(`   📥 Baixando imagem ${i + 1} do Cloudinary...`);
          
          // Baixar imagem do Cloudinary
          const response = await fetch(imagem);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Gerar thumbnail 200x200
          const thumbnail = await sharp(buffer)
            .resize(200, 200, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 60 })
            .toBuffer();

          // Converter para base64
          const base64 = `data:image/jpeg;base64,${thumbnail.toString('base64')}`;
          
          novosBackups.push(base64);
          backupsGerados++;
          
          const tamanhoKB = Math.round(base64.length / 1024);
          console.log(`   ✅ Backup criado (~${tamanhoKB}KB)`);

        } catch (error) {
          console.log(`   ⚠️  Erro ao criar backup: ${error.message}`);
          novosBackups.push('');
        }
      }

      // Atualizar produto com backups
      if (novosBackups.length > 0) {
        await produto.update({ imagens_backup: novosBackups });
        console.log(`   💾 Backups salvos no banco\n`);
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`✅ Produtos processados: ${processados}`);
    console.log(`📸 Backups gerados: ${backupsGerados}`);
    console.log(`ℹ️  Produtos que já tinham backup: ${comBackup}`);
    console.log('='.repeat(60));

    console.log('\n✨ Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

gerarBackupsDasImagensMigradas()
  .then(() => {
    console.log('\n👋 Saindo...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  });
