const { Sale, User, Customer } = require('../models/Schema');

/**
 * Listar todas as vendas
 */
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf', 'telefone']
        }
      ],
      order: [['dataHora', 'DESC']]
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas'
    });
  }
};

/**
 * Buscar venda por ID
 */
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf', 'telefone']
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar venda'
    });
  }
};

/**
 * Criar nova venda
 */
const createSale = async (req, res) => {
  try {
    const {
      numeroVenda,
      vendedor,
      clienteId,
      caixaId,
      itens,
      formaPagamento,
      subtotal,
      desconto,
      total,
      troco,
      observacoes,
      data,
      dataHora
    } = req.body;

    // Validações
    if (!numeroVenda || !itens || itens.length === 0 || !formaPagamento) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos. Número da venda, itens e forma de pagamento são obrigatórios'
      });
    }

    const sale = await Sale.create({
      numeroVenda,
      usuarioId: req.user.id,
      vendedor: vendedor || req.user.nome,
      clienteId: clienteId || null,
      caixaId: caixaId || null,
      itens,
      formaPagamento,
      subtotal: subtotal || 0,
      desconto: desconto || 0,
      total: total || 0,
      troco: troco || 0,
      observacoes: observacoes || null,
      data: data || new Date().toISOString().split('T')[0],
      dataHora: dataHora || new Date()
    });

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Venda registrada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar venda'
    });
  }
};

/**
 * Buscar vendas por período
 */
const getSalesByPeriod = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const where = {};
    if (dataInicio && dataFim) {
      where.data = {
        [require('sequelize').Op.between]: [dataInicio, dataFim]
      };
    }

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf']
        }
      ],
      order: [['dataHora', 'DESC']]
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por período:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas'
    });
  }
};

/**
 * Buscar vendas por vendedor
 */
const getSalesByVendedor = async (req, res) => {
  try {
    const { vendedor } = req.params;

    const sales = await Sale.findAll({
      where: { vendedor },
      order: [['dataHora', 'DESC']]
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por vendedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas'
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  getSalesByPeriod,
  getSalesByVendedor
};
