// Script para adicionar configurações padrão: logo_url e nome_loja
const { Configuration } = require('./src/models/Schema');
const { sequelize } = require('./src/config/database');

async function addDefaultConfiguracoes(tenantId) {
  try {
    await sequelize.authenticate();
    // Adiciona logo_url
    await Configuration.findOrCreate({
      where: { chave: 'logo_url', tenant_id: tenantId },
      defaults: {
        chave: 'logo_url',
        valor: '',
        tipo: 'texto',
        descricao: 'URL da logo da loja',
        tenant_id: tenantId
      }
    });
    // Adiciona nome_loja
    await Configuration.findOrCreate({
      where: { chave: 'nome_loja', tenant_id: tenantId },
      defaults: {
        chave: 'nome_loja',
        valor: '',
        tipo: 'texto',
        descricao: 'Nome da loja',
        tenant_id: tenantId
      }
    });
    console.log(`Configurações logo_url e nome_loja adicionadas com sucesso para tenantId: ${tenantId}`);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao adicionar configurações:', err);
    process.exit(1);
  }
}

const tenantId = process.argv[2] || 'default';
addDefaultConfiguracoes(tenantId);
