const AccountReceivable = require('../models/AccountReceivable');
const { Op } = require('sequelize');

// Criar conta a receber
exports.createAccountReceivable = async (req, res) => {
  try {
    const account = await AccountReceivable.create(req.body);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar conta a receber', error: error.message });
  }
};

// Listar contas a receber
exports.getAccountsReceivable = async (req, res) => {
  try {
    const { status, mes, ano, clienteNome } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (clienteNome) {
      where.clienteNome = {
        [Op.like]: `%${clienteNome}%`
      };
    }
    
    if (mes && ano) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
      
      where.dataVencimento = {
        [Op.between]: [dataInicio, dataFim]
      };
    }
    
    const accounts = await AccountReceivable.findAll({
      where,
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
    console.error('Erro ao buscar contas a receber:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar contas a receber', error: error.message });
  }
};

// Buscar conta por ID
exports.getAccountReceivableById = async (req, res) => {
  try {
    const account = await AccountReceivable.findByPk(req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar conta', error: error.message });
  }
};

// Registrar recebimento
exports.receivePayment = async (req, res) => {
  try {
    const { valorRecebido, dataRecebimento, formaPagamento, comprovante } = req.body;
    const account = await AccountReceivable.findByPk(req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    const novoValorRecebido = parseFloat(account.valorRecebido) + parseFloat(valorRecebido);
    const status = novoValorRecebido >= parseFloat(account.valor) ? 'recebido' : 'pendente';
    
    await account.update({
      valorRecebido: novoValorRecebido,
      status,
      dataRecebimento: status === 'recebido' ? dataRecebimento : account.dataRecebimento,
      formaPagamento: formaPagamento || account.formaPagamento,
      comprovante: comprovante || account.comprovante
    });
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Erro ao registrar recebimento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar recebimento', error: error.message });
  }
};

// Cancelar conta
exports.cancelAccount = async (req, res) => {
  try {
    const account = await AccountReceivable.findByPk(req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await account.update({ status: 'cancelado' });
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao cancelar conta', error: error.message });
  }
};

// Buscar recebimentos próximos
exports.getUpcomingReceivables = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + parseInt(dias));
    
    const accounts = await AccountReceivable.findAll({
      where: {
        status: 'pendente',
        dataVencimento: {
          [Op.between]: [hoje.toISOString().split('T')[0], dataLimite.toISOString().split('T')[0]]
        }
      },
      order: [['dataVencimento', 'ASC']]
    });
    
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Erro ao buscar recebimentos próximos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar recebimentos próximos', error: error.message });
  }
};

// Buscar clientes devedores
exports.getDebtors = async (req, res) => {
  try {
    const accounts = await AccountReceivable.findAll({
      where: {
        status: {
          [Op.in]: ['pendente', 'vencido']
        }
      },
      order: [['dataVencimento', 'ASC']]
    });
    
    // Agrupar por cliente
    const devedores = {};
    accounts.forEach(account => {
      const key = account.clienteCpfCnpj || account.clienteNome;
      if (!devedores[key]) {
        devedores[key] = {
          nome: account.clienteNome,
          cpfCnpj: account.clienteCpfCnpj,
          telefone: account.clienteTelefone,
          totalDevido: 0,
          contas: []
        };
      }
      const saldo = parseFloat(account.valor) - parseFloat(account.valorRecebido);
      devedores[key].totalDevido += saldo;
      devedores[key].contas.push({
        id: account.id,
        descricao: account.descricao,
        valor: account.valor,
        valorRecebido: account.valorRecebido,
        saldo: saldo,
        dataVencimento: account.dataVencimento,
        status: account.status
      });
    });
    
    const listaDevedores = Object.values(devedores)
      .filter(d => d.totalDevido > 0)
      .sort((a, b) => b.totalDevido - a.totalDevido);
    
    res.json({ success: true, data: listaDevedores });
  } catch (error) {
    console.error('Erro ao buscar devedores:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar devedores', error: error.message });
  }
};
