const { Configuration } = require('../models/Schema');

/**
 * Obter todas as configurações
 */
exports.getAllConfigurations = async (req, res) => {
  try {
    const configuracoes = await Configuration.findAll({
      order: [['chave', 'ASC']]
    });

    res.status(200).json({
      message: 'Configurações recuperadas com sucesso',
      data: configuracoes
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      message: 'Erro ao buscar configurações',
      error: error.message
    });
  }
};

/**
 * Obter uma configuração por chave
 */
exports.getConfigurationByKey = async (req, res) => {
  try {
    const { chave } = req.params;

    const config = await Configuration.findOne({
      where: { chave }
    });

    if (!config) {
      return res.status(404).json({
        message: 'Configuração não encontrada'
      });
    }

    // Retornar valor convertido de acordo com o tipo
    let valorConvertido = config.valor;
    if (config.tipo === 'booleano') {
      valorConvertido = config.valor === 'true';
    } else if (config.tipo === 'numero') {
      valorConvertido = parseFloat(config.valor);
    } else if (config.tipo === 'json') {
      valorConvertido = JSON.parse(config.valor);
    }

    res.status(200).json({
      message: 'Configuração encontrada',
      data: {
        ...config.toJSON(),
        valorConvertido
      }
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      message: 'Erro ao buscar configuração',
      error: error.message
    });
  }
};

/**
 * Criar ou atualizar uma configuração
 */
exports.upsertConfiguration = async (req, res) => {
  try {
    const { chave, valor, tipo, descricao } = req.body;

    if (!chave || valor === undefined) {
      return res.status(400).json({
        message: 'Chave e valor são obrigatórios'
      });
    }

    // Validar tipo
    const tiposValidos = ['texto', 'numero', 'booleano', 'json'];
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: `Tipo inválido. Use: ${tiposValidos.join(', ')}`
      });
    }

    // Converter valor para string de acordo com o tipo
    let valorString = String(valor);
    if (tipo === 'json' && typeof valor === 'object') {
      valorString = JSON.stringify(valor);
    }

    const [config, created] = await Configuration.findOrCreate({
      where: { chave },
      defaults: {
        chave,
        valor: valorString,
        tipo: tipo || 'texto',
        descricao
      }
    });

    if (!created) {
      // Atualizar se já existir
      await config.update({
        valor: valorString,
        tipo: tipo || config.tipo,
        descricao: descricao !== undefined ? descricao : config.descricao
      });
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'Configuração criada com sucesso' : 'Configuração atualizada com sucesso',
      data: config
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({
      message: 'Erro ao salvar configuração',
      error: error.message
    });
  }
};

/**
 * Deletar uma configuração
 */
exports.deleteConfiguration = async (req, res) => {
  try {
    const { chave } = req.params;

    const config = await Configuration.findOne({
      where: { chave }
    });

    if (!config) {
      return res.status(404).json({
        message: 'Configuração não encontrada'
      });
    }

    await config.destroy();

    res.status(200).json({
      message: 'Configuração deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar configuração:', error);
    res.status(500).json({
      message: 'Erro ao deletar configuração',
      error: error.message
    });
  }
};

/**
 * Inicializar configurações padrão
 */
exports.initializeDefaultConfigurations = async () => {
  try {
    const defaults = [
      {
        chave: 'exigir_caixa_aberto',
        valor: 'false',
        tipo: 'booleano',
        descricao: 'Define se é obrigatório ter um caixa aberto para realizar vendas no PDV'
      },
      {
        chave: 'permitir_venda_estoque_zero',
        valor: 'false',
        tipo: 'booleano',
        descricao: 'Permite realizar vendas mesmo quando o produto está sem estoque'
      },
      {
        chave: 'limite_desconto_pdv',
        valor: '50',
        tipo: 'numero',
        descricao: 'Percentual máximo de desconto permitido no PDV'
      },
      {
        chave: 'logo_url',
        valor: '',
        tipo: 'texto',
        descricao: 'URL da logo da loja exibida no menu sidebar'
      },
      {
        chave: 'nome_loja',
        valor: 'ModaStore',
        tipo: 'texto',
        descricao: 'Nome da loja exibido no menu sidebar'
      }
    ];

    for (const config of defaults) {
      await Configuration.findOrCreate({
        where: { chave: config.chave },
        defaults: config
      });
    }

    console.log('✅ Configurações padrão inicializadas');
  } catch (error) {
    console.error('❌ Erro ao inicializar configurações padrão:', error);
  }
};
