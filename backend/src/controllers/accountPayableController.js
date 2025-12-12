const AccountPayable = require('../models/AccountPayable');
const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// Criar conta a pagar
exports.createAccountPayable = async (req, res) => {
  try {
    const account = await AccountPayable.create(req.body);
    
    const accountCompleta = await AccountPayable.findByPk(account.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.status(201).json({ success: true, data: accountCompleta });
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar conta a pagar', error: error.message });
  }
};

// Listar contas a pagar
exports.getAccountsPayable = async (req, res) => {
  try {
    const { status, mes, ano, supplierId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    
    if (mes && ano) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
      
      where.dataVencimento = {
        [Op.between]: [dataInicio, dataFim]
      };
    }
    
    const accounts = await AccountPayable.findAll({
      where,
      include: [{ model: Supplier, as: 'fornecedor' }],
      order: [['dataVencimento', 'ASC']]
    });
    
    // Atualizar status de vencidos
    const hoje = new Date().toISOString().split('T')[0];
    for (const account of accounts) {
      if (account.status === 'pendente' && account.dataVencimento < hoje) {
        await account.update({ status: 'vencido' });
      }
    }
    
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar contas a pagar', error: error.message });
  }
};

// Buscar conta por ID
exports.getAccountPayableById = async (req, res) => {
  try {
    const account = await AccountPayable.findByPk(req.params.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar conta', error: error.message });
  }
};

// Registrar pagamento
exports.payAccount = async (req, res) => {
  try {
    const { valorPago, dataPagamento, formaPagamento, comprovante } = req.body;
    const account = await AccountPayable.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    const novoValorPago = parseFloat(account.valorPago) + parseFloat(valorPago);
    const status = novoValorPago >= parseFloat(account.valor) ? 'pago' : 'pendente';
    
    await account.update({
      valorPago: novoValorPago,
      status,
      dataPagamento: status === 'pago' ? dataPagamento : account.dataPagamento,
      formaPagamento: formaPagamento || account.formaPagamento,
      comprovante: comprovante || account.comprovante
    });
    
    const accountAtualizada = await AccountPayable.findByPk(account.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: accountAtualizada });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar pagamento', error: error.message });
  }
};

// Cancelar conta
exports.cancelAccount = async (req, res) => {
  try {
    const account = await AccountPayable.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await account.update({ status: 'cancelado' });
    
    const accountAtualizada = await AccountPayable.findByPk(account.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: accountAtualizada });
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao cancelar conta', error: error.message });
  }
};

// Buscar contas próximas ao vencimento
exports.getUpcomingPayments = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + parseInt(dias));
    
    const accounts = await AccountPayable.findAll({
      where: {
        status: 'pendente',
        dataVencimento: {
          [Op.between]: [hoje.toISOString().split('T')[0], dataLimite.toISOString().split('T')[0]]
        }
      },
      include: [{ model: Supplier, as: 'fornecedor' }],
      order: [['dataVencimento', 'ASC']]
    });
    
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Erro ao buscar pagamentos próximos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamentos próximos', error: error.message });
  }
};
