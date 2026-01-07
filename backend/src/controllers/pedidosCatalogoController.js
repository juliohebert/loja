const { PedidoCatalogo, Product } = require('../models/Schema');
const { Op } = require('sequelize');

/**
 * Controlador para Gestão de Pedidos do Catálogo (área administrativa)
 */

// Listar todos os pedidos (com filtros)
exports.listarPedidos = async (req, res) => {
  try {
    const {
      status,
      origem,
      data_inicio,
      data_fim,
      busca,
      ordem = 'recentes',
      limite = 20,
      pagina = 1
    } = req.query;

    const tenantId = req.tenantId;

    // Construir filtros
    const where = { tenant_id: tenantId };

    if (status) {
      where.status = status;
    }

    if (origem) {
      where.origem = origem;
    }

    if (data_inicio && data_fim) {
      where.criado_em = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    } else if (data_inicio) {
      where.criado_em = {
        [Op.gte]: new Date(data_inicio)
      };
    } else if (data_fim) {
      where.criado_em = {
        [Op.lte]: new Date(data_fim)
      };
    }

    if (busca) {
      where[Op.or] = [
        { numero_pedido: { [Op.iLike]: `%${busca}%` } },
        { cliente_nome: { [Op.iLike]: `%${busca}%` } },
        { cliente_telefone: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    // Determinar ordenação
    let order = [['criado_em', 'DESC']];
    if (ordem === 'antigos') {
      order = [['criado_em', 'ASC']];
    } else if (ordem === 'valor_maior') {
      order = [['valor_total', 'DESC']];
    } else if (ordem === 'valor_menor') {
      order = [['valor_total', 'ASC']];
    } else if (ordem === 'cliente') {
      order = [['cliente_nome', 'ASC']];
    }

    // Paginação
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: pedidos } = await PedidoCatalogo.findAndCountAll({
      where,
      order,
      limit: parseInt(limite),
      offset
    });

    res.json({
      success: true,
      data: pedidos,
      pagination: {
        total: count,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total_paginas: Math.ceil(count / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedidos',
      error: error.message
    });
  }
};

// Obter detalhes de um pedido específico
exports.obterDetalhePedido = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const pedido = await PedidoCatalogo.findOne({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    res.json({
      success: true,
      data: pedido
    });

  } catch (error) {
    console.error('Erro ao obter detalhe do pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar detalhes do pedido',
      error: error.message
    });
  }
};

// Atualizar status de um pedido
exports.atualizarStatusPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;
    const tenantId = req.tenantId;

    // Validar status
    const statusValidos = ['novo', 'processando', 'separacao', 'enviado', 'entregue', 'cancelado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido',
        status_validos: statusValidos
      });
    }

    const pedido = await PedidoCatalogo.findOne({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Validar transições de status
    const statusAnterior = pedido.status;
    
    // Não permitir alterar pedidos já entregues ou cancelados
    if (statusAnterior === 'entregue' || statusAnterior === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: `Não é possível alterar pedidos com status "${statusAnterior}"`
      });
    }

    // Atualizar pedido
    await pedido.update({
      status,
      observacoes: observacoes || pedido.observacoes,
      atualizado_em: new Date()
    });

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: pedido
    });

  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pedido',
      error: error.message
    });
  }
};

// Atualizar dados do cliente ou observações
exports.atualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_nome,
      cliente_telefone,
      cliente_email,
      cliente_endereco,
      observacoes
    } = req.body;
    const tenantId = req.tenantId;

    const pedido = await PedidoCatalogo.findOne({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Não permitir editar pedidos entregues ou cancelados
    if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: `Não é possível editar pedidos com status "${pedido.status}"`
      });
    }

    // Atualizar apenas os campos fornecidos
    const dadosAtualizacao = {};
    if (cliente_nome !== undefined) dadosAtualizacao.cliente_nome = cliente_nome;
    if (cliente_telefone !== undefined) dadosAtualizacao.cliente_telefone = cliente_telefone;
    if (cliente_email !== undefined) dadosAtualizacao.cliente_email = cliente_email;
    if (cliente_endereco !== undefined) dadosAtualizacao.cliente_endereco = cliente_endereco;
    if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes;
    dadosAtualizacao.atualizado_em = new Date();

    await pedido.update(dadosAtualizacao);

    res.json({
      success: true,
      message: 'Pedido atualizado com sucesso',
      data: pedido
    });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pedido',
      error: error.message
    });
  }
};

// Obter estatísticas dos pedidos
exports.obterEstatisticasPedidos = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const tenantId = req.tenantId;

    const where = { tenant_id: tenantId };

    if (data_inicio && data_fim) {
      where.criado_em = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }

    // Contar pedidos por status
    const todosPedidos = await PedidoCatalogo.findAll({
      where,
      attributes: ['status', 'valor_total', 'origem']
    });

    const estatisticas = {
      total_pedidos: todosPedidos.length,
      por_status: {
        novo: todosPedidos.filter(p => p.status === 'novo').length,
        processando: todosPedidos.filter(p => p.status === 'processando').length,
        separacao: todosPedidos.filter(p => p.status === 'separacao').length,
        enviado: todosPedidos.filter(p => p.status === 'enviado').length,
        entregue: todosPedidos.filter(p => p.status === 'entregue').length,
        cancelado: todosPedidos.filter(p => p.status === 'cancelado').length
      },
      por_origem: {
        catalogo: todosPedidos.filter(p => p.origem === 'catalogo').length,
        whatsapp: todosPedidos.filter(p => p.origem === 'whatsapp').length,
        loja_fisica: todosPedidos.filter(p => p.origem === 'loja_fisica').length
      },
      valor_total: todosPedidos.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0),
      ticket_medio: todosPedidos.length > 0 
        ? todosPedidos.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0) / todosPedidos.length 
        : 0
    };

    res.json({
      success: true,
      data: estatisticas
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas',
      error: error.message
    });
  }
};

// Deletar um pedido (soft delete alterando status)
exports.deletarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const pedido = await PedidoCatalogo.findOne({
      where: {
        id,
        tenant_id: tenantId
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Soft delete - apenas marca como cancelado
    await pedido.update({
      status: 'cancelado',
      atualizado_em: new Date()
    });

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar pedido',
      error: error.message
    });
  }
};

module.exports = exports;
