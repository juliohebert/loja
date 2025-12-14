// Listar todas as lojas com status de assinatura/trial para o super-admin
const { Op } = require('sequelize');
exports.listLojasComAssinaturaStatus = async (req, res) => {
  try {
    const User = require('../models/User');
    // Buscar todos os tenants únicos
    const tenants = await User.findAll({
      attributes: [
        [require('sequelize').fn('DISTINCT', require('sequelize').col('tenant_id')), 'tenantId']
      ],
      where: { tenant_id: { [Op.ne]: null } },
      raw: true
    });
    // Para cada tenant, buscar informações adicionais e assinatura
    const resultado = await Promise.all(tenants.map(async (tenant) => {
      // Buscar primeiro usuário admin do tenant para pegar nome/email/criado_em
      const adminUser = await User.findOne({
        where: { tenant_id: tenant.tenantId, funcao: 'admin' },
        attributes: ['id', 'nome', 'email', 'criado_em', 'tenant_id']
      });
      // Buscar assinatura ativa ou trial mais recente para esse tenant
      const assinatura = await Subscription.findOne({
        where: {
          lojaId: tenant.tenantId,
          status: { [Op.in]: ['ativa', 'trial'] }
        },
        order: [['dataInicio', 'DESC']]
      });
      let diasRestantesTrial = null;
      if (assinatura && assinatura.status === 'trial') {
        const hoje = new Date();
        const fimTrial = new Date(assinatura.dataFim);
        diasRestantesTrial = Math.max(0, Math.ceil((fimTrial - hoje) / (1000 * 60 * 60 * 24)));
      }
      return {
        tenantId: tenant.tenantId,
        nomeLoja: adminUser ? adminUser.nome : null,
        email: adminUser ? adminUser.email : null,
        criado_em: adminUser ? adminUser.criado_em : null,
        assinatura: assinatura || null,
        diasRestantesTrial
      };
    }));
    res.json({ data: resultado });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar lojas e assinaturas', details: err.message });
  }
};
// Métricas agregadas para painel do super-admin
exports.metrics = async (req, res) => {
  try {
    // Lojas ativas: lojas com pelo menos uma assinatura ativa
    const lojasAtivas = await Subscription.count({ where: { status: 'ativa' }, distinct: true, col: 'lojaId' });

    // Assinaturas pendentes: status trial ou suspensa
    const assinaturasPendentes = await Subscription.count({ where: { status: ['trial', 'suspensa'] } });

    // Receita mensal: soma dos valores das assinaturas ativas e pagas no mês atual
    const { Op } = require('sequelize');
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const receitaMensal = await Subscription.sum('valor', {
      where: {
        status: 'ativa',
        pago: true,
        dataInicio: { [Op.between]: [inicioMes, fimMes] }
      }
    });

    // Cancelamentos: assinaturas canceladas no mês atual
    const cancelamentos = await Subscription.count({
      where: {
        status: 'cancelada',
        atualizado_em: { [Op.between]: [inicioMes, fimMes] }
      }
    });

    res.json({
      lojasAtivas,
      assinaturasPendentes,
      receitaMensal: receitaMensal || 0,
      cancelamentos
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar métricas', details: err.message });
  }
};
const Subscription = require('../models/Subscription');
const MasterStore = require('../models/MasterStore');

// Listar todas as assinaturas (super-admin) com filtros, ordenação e paginação
exports.listAll = async (req, res) => {
  try {
    const { search = '', status = '', order = 'desc', page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (status) {
      // status pode ser múltiplo (ex: status=ativa,trial)
      const statusArr = status.split(',').map(s => s.trim());
      where.status = statusArr.length > 1 ? statusArr : statusArr[0];
    }
    if (search) {
      // Busca por nome da loja, id da loja ou email
      where['$loja.nomeLoja$'] = { [require('sequelize').Op.iLike]: `%${search}%` };
    }
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const { count, rows } = await Subscription.findAndCountAll({
      where,
      include: [{ model: MasterStore, as: 'loja', attributes: ['nomeLoja', 'id', 'email'] }],
      order: [['criado_em', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });
    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar assinaturas', details: err.message });
  }
};

// Atualizar status/pagamento da assinatura
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pago, dataFim } = req.body;
    const assinatura = await Subscription.findByPk(id);
    if (!assinatura) return res.status(404).json({ error: 'Assinatura não encontrada' });
    if (status) assinatura.status = status;
    if (typeof pago === 'boolean') assinatura.pago = pago;
    if (dataFim) assinatura.dataFim = dataFim;
    await assinatura.save();
    res.json(assinatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar assinatura', details: err.message });
  }
};

// Criar nova assinatura (super-admin)
exports.create = async (req, res) => {
  try {
    // Para super-admin, usar o tenantId do header ou do body
    let lojaId = req.body.lojaId;
    if (!lojaId && req.headers['x-tenant-id']) {
      lojaId = req.headers['x-tenant-id'];
    }
    const { plano, valor, dataInicio, dataFim } = req.body;
    if (!lojaId) {
      return res.status(400).json({ error: 'lojaId (tenantId) é obrigatório' });
    }
    const assinatura = await Subscription.create({
      lojaId, plano, valor, dataInicio, dataFim
    });
    res.status(201).json(assinatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar assinatura', details: err.message });
  }
};
