const { Configuration } = require('./src/models/Schema');

async function addLogoConfigs() {
  try {
    // Adicionar configuração de logo_url
    await Configuration.findOrCreate({
      where: {
        chave: 'logo_url',
        tenant_id: 'tenant_loja_3tec_1765500122876'
      },
      defaults: {
        valor: '',
        tipo: 'texto',
        descricao: 'URL ou caminho da logo da loja exibida no menu lateral'
      }
    });

    // Adicionar configuração de nome_loja
    await Configuration.findOrCreate({
      where: {
        chave: 'nome_loja',
        tenant_id: 'tenant_loja_3tec_1765500122876'
      },
      defaults: {
        valor: 'ModaStore',
        tipo: 'texto',
        descricao: 'Nome da loja exibido ao lado da logo no menu lateral'
      }
    });

    console.log('✅ Configurações adicionadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar configurações:', error);
    process.exit(1);
  }
}

addLogoConfigs();
