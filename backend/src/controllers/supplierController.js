const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// Criar fornecedor
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar fornecedor', error: error.message });
  }
};

// Listar todos os fornecedores
exports.getSuppliers = async (req, res) => {
  try {
    const { ativo } = req.query;
    
    const where = {};
    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }
    
    const suppliers = await Supplier.findAll({ 
      where,
      order: [['nome', 'ASC']]
    });
    
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar fornecedores', error: error.message });
  }
};

// Buscar fornecedor por ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar fornecedor', error: error.message });
  }
};

// Atualizar fornecedor
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    
    await supplier.update(req.body);
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar fornecedor', error: error.message });
  }
};

// Deletar fornecedor (soft delete)
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    
    // Soft delete
    await supplier.update({ ativo: false });
    res.json({ success: true, message: 'Fornecedor desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar fornecedor', error: error.message });
  }
};

// Atualizar avaliação do fornecedor
exports.updateRating = async (req, res) => {
  try {
    const { avaliacaoQualidade, avaliacaoPontualidade } = req.body;
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    
    await supplier.update({ avaliacaoQualidade, avaliacaoPontualidade });
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar avaliação', error: error.message });
  }
};
