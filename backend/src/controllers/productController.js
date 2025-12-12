const { Product, Variation, Stock, sequelize } = require('../models/Schema');

/**
 * 🎯 OBJECTIVE: Create a controller function to create a Product with Variations and Stock.
 * CRITICAL: This must use a DATABASE TRANSACTION. If any part fails, rollback everything.
 */

/**
 * Cria um produto com suas variações e estoque inicial
 * @route POST /api/products
 */
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { nome, descricao, marca, categoria, precoCusto, precoVenda, variacoes, imagens } = req.body;

    // Validações básicas
    if (!nome || !marca || !precoCusto || !precoVenda) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, marca, precoCusto, precoVenda' 
      });
    }

    if (!variacoes || !Array.isArray(variacoes) || variacoes.length === 0) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'É necessário informar pelo menos uma variação' 
      });
    }

    // 1. Create the parent Product
    const product = await Product.create({
      nome,
      descricao,
      marca,
      categoria: categoria || 'Geral',
      precoCusto: parseFloat(precoCusto),
      precoVenda: parseFloat(precoVenda),
      imagens: imagens || [],
      tenant_id: req.tenantId // Associar ao tenant
    }, { transaction: t });

    // 2. Iterate over 'variacoes' array and create Variation + Stock
    const variationsCreated = [];

    for (const variacao of variacoes) {
      // Validar dados da variação
      if (!variacao.tamanho || !variacao.cor) {
        await t.rollback();
        return res.status(400).json({ 
          error: 'Cada variação deve ter tamanho e cor' 
        });
      }

      // SKU opcional - usar o fornecido ou deixar null
      const sku = variacao.sku || null;

      // a) Create Variation record (linked to product_id)
      const variationRecord = await Variation.create({
        produtoId: product.id,
        sku,
        tamanho: variacao.tamanho,
        cor: variacao.cor,
        codigoBarras: variacao.codigoBarras || null
      }, { transaction: t });

      // b) Create Stock record (linked to variation_id) with initial quantity
      const stockRecord = await Stock.create({
        variacaoId: variationRecord.id,
        quantidade: parseInt(variacao.quantidade) || 0,
        limiteMinimo: parseInt(variacao.limiteMinimo) || 5,
        localizacao: variacao.localizacao || null
      }, { transaction: t });

      variationsCreated.push({
        ...variationRecord.toJSON(),
        stock: stockRecord.toJSON()
      });
    }

    // Commit da transação
    await t.commit();

    // Calcular margem
    const custo = parseFloat(product.precoCusto);
    const venda = parseFloat(product.precoVenda);
    const margin = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(2) : 0;

    res.status(201).json({ 
      message: 'Produto criado com sucesso',
      data: {
        product: product.toJSON(),
        margin: `${margin}%`,
        variations: variationsCreated
      }
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Erro ao criar produto:', error);
    
    // Tratamento de erros específicos
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: 'SKU ou código de barras já existe no sistema' 
      });
    }
    
    res.status(500).json({ 
      error: 'Falha ao criar produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lista todos os produtos com suas variações e estoque
 * @route GET /api/products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { tenant_id: req.tenantId }, // Filtrar por tenant
      include: [
        {
          model: Variation,
          as: 'variacoes',
          include: [
            {
              model: Stock,
              as: 'estoque'
            }
          ]
        }
      ],
      order: [['criado_em', 'DESC']]
    });

    res.status(200).json({
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Falha ao buscar produtos' });
  }
};

/**
 * Busca um produto específico por ID
 * @route GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        id,
        tenant_id: req.tenantId // Filtrar por tenant
      },
      include: [
        {
          model: Variation,
          as: 'variacoes',
          include: [
            {
              model: Stock,
              as: 'estoque'
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.status(200).json({ data: product });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Falha ao buscar produto' });
  }
};

/**
 * Atualiza estoque de uma variação
 * @route PATCH /api/products/stock/:variationId
 */
exports.updateStock = async (req, res) => {
  try {
    const { variationId } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    // Buscar variação com filtro de tenantId
    const variation = await Variation.findOne({
      where: { id: variationId },
      include: [{
        model: Product,
        as: 'produto',
        where: { tenant_id: req.tenantId }
      }]
    });

    if (!variation) {
      return res.status(404).json({ error: 'Variação não encontrada' });
    }

    const stock = await Stock.findOne({ where: { variacao_id: variationId } });

    if (!stock) {
      return res.status(404).json({ error: 'Estoque não encontrado' });
    }

    if (operation === 'add') {
      stock.quantidade += parseInt(quantity);
    } else if (operation === 'subtract') {
      if (stock.quantidade < parseInt(quantity)) {
        return res.status(400).json({ error: 'Estoque insuficiente' });
      }
      stock.quantidade -= parseInt(quantity);
    } else {
      stock.quantidade = parseInt(quantity);
    }

    await stock.save();

    res.status(200).json({
      message: 'Estoque atualizado com sucesso',
      data: stock
    });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Falha ao atualizar estoque' });
  }
};

/**
 * Deletar produto e suas variações/estoque
 * @route DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ 
      where: { 
        id, 
        tenant_id: req.tenantId 
      } 
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // O cascade delete já está configurado no modelo, então deletará variações e estoque automaticamente
    await product.destroy();

    res.status(200).json({ 
      message: 'Produto removido com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ 
      error: 'Falha ao remover produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualizar produto completo com variações e estoque
 * @route PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { nome, descricao, marca, categoria, precoCusto, precoVenda, variacoes, imagens } = req.body;

    // Buscar produto existente com filtro de tenantId
    const product = await Product.findOne({
      where: { 
        id, 
        tenant_id: req.tenantId 
      },
      include: [{
        model: Variation,
        as: 'variacoes',
        include: [{
          model: Stock,
          as: 'estoque'
        }]
      }]
    });

    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Validações básicas
    if (!nome || !marca || !precoCusto || !precoVenda) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, marca, precoCusto, precoVenda' 
      });
    }

    if (!variacoes || !Array.isArray(variacoes) || variacoes.length === 0) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'É necessário informar pelo menos uma variação' 
      });
    }

    // Atualizar dados do produto
    await product.update({
      nome,
      descricao,
      marca,
      categoria: categoria || 'Geral',
      precoCusto: parseFloat(precoCusto),
      precoVenda: parseFloat(precoVenda),
      imagens: imagens || []
    }, { transaction: t });

    // Deletar variações antigas
    await Variation.destroy({
      where: { produtoId: product.id },
      transaction: t
    });

    // Criar novas variações
    const variationsCreated = [];

    for (const variacao of variacoes) {
      // Validar dados da variação
      if (!variacao.tamanho || !variacao.cor) {
        await t.rollback();
        return res.status(400).json({ 
          error: 'Cada variação deve ter tamanho e cor' 
        });
      }

      // SKU opcional
      const sku = variacao.sku || null;

      // Criar registro de variação
      const variationRecord = await Variation.create({
        produtoId: product.id,
        sku,
        tamanho: variacao.tamanho,
        cor: variacao.cor,
        codigoBarras: variacao.codigoBarras || null
      }, { transaction: t });

      // Criar registro de estoque
      const stockRecord = await Stock.create({
        variacaoId: variationRecord.id,
        quantidade: parseInt(variacao.quantidade) || 0,
        limiteMinimo: parseInt(variacao.limiteMinimo) || 5,
        localizacao: variacao.localizacao || null
      }, { transaction: t });

      variationsCreated.push({
        ...variationRecord.toJSON(),
        stock: stockRecord.toJSON()
      });
    }

    // Commit da transação
    await t.commit();

    // Calcular margem
    const custo = parseFloat(product.precoCusto);
    const venda = parseFloat(product.precoVenda);
    const margin = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(2) : 0;

    res.status(200).json({ 
      message: 'Produto atualizado com sucesso',
      data: {
        product: product.toJSON(),
        margin: `${margin}%`,
        variations: variationsCreated
      }
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Falha ao atualizar produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
