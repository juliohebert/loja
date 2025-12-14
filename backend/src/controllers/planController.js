const Plan = require('../models/Plan');
const { Op } = require('sequelize');

// Listar planos disponíveis (público - somente ativos)
exports.getAvailablePlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['isRecommended', 'DESC'], ['price', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Erro ao buscar planos disponíveis:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar planos disponíveis' });
  }
};

// Listar todos os planos (admin)
exports.getAllPlans = async (req, res) => {
  try {
    const { active, search } = req.query;

    const where = {};

    // Só filtra se active for 'true' ou 'false'
    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const plans = await Plan.findAll({
      where,
      order: [['isRecommended', 'DESC'], ['price', 'ASC']]
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar planos' });
  }
};

// Buscar plano por ID
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plano não encontrado' });
    }
    
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar plano' });
  }
};

// Criar novo plano
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      features,
      maxProducts,
      maxUsers,
      isActive,
      isRecommended,
      trialDays
    } = req.body;
    
    // Validações
    if (!name || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço e duração são obrigatórios'
      });
    }
    
    // Verificar se já existe plano com esse nome
    const existingPlan = await Plan.findOne({ where: { name } });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um plano com esse nome'
      });
    }
    
    const plan = await Plan.create({
      name,
      description,
      price,
      duration,
      features: features || [],
      maxProducts,
      maxUsers,
      isActive: isActive !== undefined ? isActive : true,
      isRecommended: isRecommended || false,
      trialDays: trialDays || 0
    });
    
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar plano' });
  }
};

// Atualizar plano
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      duration,
      features,
      maxProducts,
      maxUsers,
      isActive,
      isRecommended,
      trialDays
    } = req.body;
    
    const plan = await Plan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plano não encontrado' });
    }
    
    // Verificar nome duplicado (se mudou)
    if (name && name !== plan.name) {
      const existingPlan = await Plan.findOne({ where: { name } });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um plano com esse nome'
        });
      }
    }
    
    await plan.update({
      name: name || plan.name,
      description: description !== undefined ? description : plan.description,
      price: price !== undefined ? price : plan.price,
      duration: duration || plan.duration,
      features: features !== undefined ? features : plan.features,
      maxProducts: maxProducts !== undefined ? maxProducts : plan.maxProducts,
      maxUsers: maxUsers !== undefined ? maxUsers : plan.maxUsers,
      isActive: isActive !== undefined ? isActive : plan.isActive,
      isRecommended: isRecommended !== undefined ? isRecommended : plan.isRecommended,
      trialDays: trialDays !== undefined ? trialDays : plan.trialDays
    });
    
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar plano' });
  }
};

// Deletar plano
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plano não encontrado' });
    }
    
    // Verificar se há assinaturas ativas neste plano
    // TODO: Adicionar verificação de assinaturas quando implementar
    
    await plan.destroy();
    
    res.json({ success: true, message: 'Plano deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar plano:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar plano' });
  }
};

// Ativar/desativar plano
exports.togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plano não encontrado' });
    }
    
    plan.isActive = !plan.isActive;
    await plan.save();
    
    res.json({
      success: true,
      message: `Plano ${plan.isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: plan
    });
  } catch (error) {
    console.error('Erro ao alterar status do plano:', error);
    res.status(500).json({ success: false, message: 'Erro ao alterar status do plano' });
  }
};
