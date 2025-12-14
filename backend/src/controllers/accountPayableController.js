const ContaPagar = require('../models/AccountPayable');
const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// Criar conta a pagar
exports.createContaPagar = async (req, res) => {
  try {
    const conta = await ContaPagar.create(req.body);
    
    const contaCompleta = await ContaPagar.findByPk(conta.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.status(201).json({ success: true, data: contaCompleta });
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar conta a pagar', error: error.message });
  }
};

// Listar contas a pagar
exports.getContasPagar = async (req, res) => {
  try {
    const { status, mes, ano, supplierId } = req.query;
    
    const where = {
      tenant_id: req.tenantId
    };
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
    
    const contas = await ContaPagar.findAll({
      where,
      include: [{ model: Supplier, as: 'fornecedor' }],
      order: [['dataVencimento', 'ASC']]
    });
    
    // Atualizar status de vencidos
    const hoje = new Date().toISOString().split('T')[0];
    for (const conta of contas) {
      if (conta.status === 'pendente' && conta.dataVencimento < hoje) {
        await conta.update({ status: 'vencido' });
      }
    }
    
    res.json({ success: true, data: contas });
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar contas a pagar', error: error.message });
  }
};

// Buscar conta por ID
exports.getContaPagarById = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    res.json({ success: true, data: conta });
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar conta', error: error.message });
  }
};

// Atualizar conta a pagar
exports.updateContaPagar = async (req, res) => {
  try {
    const conta = await ContaPagar.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await conta.update(req.body);
    
    const contaAtualizada = await ContaPagar.findByPk(conta.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: contaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar conta', error: error.message });
  }
};

// Inativar conta a pagar
exports.inativarContaPagar = async (req, res) => {
  try {
    const conta = await ContaPagar.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await conta.update({ ativo: false });
    
    const contaAtualizada = await ContaPagar.findByPk(conta.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: contaAtualizada, message: 'Conta inativada com sucesso' });
  } catch (error) {
    console.error('Erro ao inativar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao inativar conta', error: error.message });
  }
};

// Registrar pagamento
exports.pagarConta = async (req, res) => {
  try {
    const { valorPago, dataPagamento, formaPagamento, comprovante } = req.body;
    const conta = await ContaPagar.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    const novoValorPago = parseFloat(conta.valorPago) + parseFloat(valorPago);
    const status = novoValorPago >= parseFloat(conta.valor) ? 'pago' : 'pendente';
    
    await conta.update({
      valorPago: novoValorPago,
      status,
      dataPagamento: status === 'pago' ? dataPagamento : conta.dataPagamento,
      formaPagamento: formaPagamento || conta.formaPagamento,
      comprovante: comprovante || conta.comprovante
    });
    
    const contaAtualizada = await ContaPagar.findByPk(conta.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: contaAtualizada });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar pagamento', error: error.message });
  }
};

// Cancelar conta
exports.cancelarConta = async (req, res) => {
  try {
    const conta = await ContaPagar.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await conta.update({ status: 'cancelado' });
    
    const contaAtualizada = await ContaPagar.findByPk(conta.id, {
      include: [{ model: Supplier, as: 'fornecedor' }]
    });
    
    res.json({ success: true, data: contaAtualizada });
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao cancelar conta', error: error.message });
  }
};

// Buscar contas próximas ao vencimento
exports.getPagamentosProximos = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + parseInt(dias));
    
    const contas = await ContaPagar.findAll({
      where: {
        status: 'pendente',
        dataVencimento: {
          [Op.between]: [hoje.toISOString().split('T')[0], dataLimite.toISOString().split('T')[0]]
        }
      },
      include: [{ model: Supplier, as: 'fornecedor' }],
      order: [['dataVencimento', 'ASC']]
    });
    
    res.json({ success: true, data: contas });
  } catch (error) {
    console.error('Erro ao buscar pagamentos próximos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamentos próximos', error: error.message });
  }
};
