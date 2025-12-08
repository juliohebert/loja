const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const { Product, Variation, Stock } = require('../models/Schema');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Gerar número de pedido
const gerarNumeroPedido = async () => {
  const ultimoPedido = await PurchaseOrder.findOne({
    order: [['id', 'DESC']]
  });
  
  const numero = ultimoPedido ? parseInt(ultimoPedido.numeroPedido.split('-')[1]) + 1 : 1;
  return `PC-${String(numero).padStart(6, '0')}`;
};

// Criar ordem de compra
exports.createPurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const numeroPedido = await gerarNumeroPedido();
    
    const purchaseOrder = await PurchaseOrder.create({
      ...req.body,
      numeroPedido,
      userId: req.user.id
    }, { transaction });
    
    await transaction.commit();
    
    const pedidoCompleto = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        { model: Supplier, as: 'fornecedor' }
      ]
    });
    
    res.status(201).json({ success: true, data: pedidoCompleto });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar ordem de compra:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar ordem de compra', error: error.message });
  }
};

// Listar ordens de compra
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplierId, dataInicio, dataFim } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    
    if (dataInicio && dataFim) {
      where.dataPedido = {
        [Op.between]: [dataInicio, dataFim]
      };
    }
    
    const orders = await PurchaseOrder.findAll({
      where,
      include: [
        { model: Supplier, as: 'fornecedor' }
      ],
      order: [['dataPedido', 'DESC']]
    });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Erro ao buscar ordens de compra:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar ordens de compra', error: error.message });
  }
};

// Buscar ordem de compra por ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'fornecedor' }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Ordem de compra não encontrada' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erro ao buscar ordem de compra:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar ordem de compra', error: error.message });
  }
};

// Atualizar status da ordem de compra
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Ordem de compra não encontrada' });
    }
    
    await order.update({ status });
    
    const pedidoAtualizado = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: pedidoAtualizado });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar status', error: error.message });
  }
};

// Dar entrada no estoque (receber mercadoria)
exports.receiveOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Ordem de compra não encontrada' });
    }
    
    if (order.status === 'recebido') {
      return res.status(400).json({ success: false, message: 'Pedido já foi recebido' });
    }
    
    const { dataEntrega, itensRecebidos } = req.body;
    
    // Atualizar estoque para cada item
    for (const item of itensRecebidos) {
      const stock = await Stock.findOne({
        where: { variationId: item.variationId }
      });
      
      if (stock) {
        await stock.update({
          quantidade: parseFloat(stock.quantidade) + parseFloat(item.quantidadeRecebida)
        }, { transaction });
      }
    }
    
    // Atualizar status do pedido
    await order.update({
      status: 'recebido',
      dataEntrega: dataEntrega || new Date()
    }, { transaction });
    
    await transaction.commit();
    
    const pedidoAtualizado = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: pedidoAtualizado });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao receber pedido:', error);
    res.status(500).json({ success: false, message: 'Erro ao receber pedido', error: error.message });
  }
};

// Cancelar ordem de compra
exports.cancelOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Ordem de compra não encontrada' });
    }
    
    if (order.status === 'recebido') {
      return res.status(400).json({ success: false, message: 'Não é possível cancelar um pedido já recebido' });
    }
    
    await order.update({ status: 'cancelado' });
    
    const pedidoAtualizado = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: pedidoAtualizado });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({ success: false, message: 'Erro ao cancelar pedido', error: error.message });
  }
};
