const ContaReceber = require('../models/AccountReceivable');
const { Op } = require('sequelize');

// Criar conta a receber
exports.createContaReceber = async (req, res) => {
  try {
    const conta = await ContaReceber.create(req.body);
    res.status(201).json({ success: true, data: conta });
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar conta a receber', error: error.message });
  }
};

// Listar contas a receber
exports.getContasReceber = async (req, res) => {
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
    
    const contas = await ContaReceber.findAll({
      where,
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
    console.error('Erro ao buscar contas a receber:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar contas a receber', error: error.message });
  }
};

// Buscar conta por ID
exports.getContaReceberById = async (req, res) => {
  try {
    const conta = await ContaReceber.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
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

// Registrar recebimento
exports.receberPagamento = async (req, res) => {
  try {
    const { valorRecebido, dataRecebimento, formaPagamento, comprovante } = req.body;
    const conta = await ContaReceber.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    const novoValorRecebido = parseFloat(conta.valorRecebido) + parseFloat(valorRecebido);
    const status = novoValorRecebido >= parseFloat(conta.valor) ? 'recebido' : 'pendente';
    
    await conta.update({
      valorRecebido: novoValorRecebido,
      status,
      dataRecebimento: status === 'recebido' ? dataRecebimento : conta.dataRecebimento,
      formaPagamento: formaPagamento || conta.formaPagamento,
      comprovante: comprovante || conta.comprovante
    });
    
    res.json({ success: true, data: conta });
  } catch (error) {
    console.error('Erro ao registrar recebimento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar recebimento', error: error.message });
  }
};

// Cancelar conta
exports.cancelarConta = async (req, res) => {
  try {
    const conta = await ContaReceber.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });
    
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    
    await conta.update({ status: 'cancelado' });
    res.json({ success: true, data: conta });
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    res.status(500).json({ success: false, message: 'Erro ao cancelar conta', error: error.message });
  }
};

// Buscar recebimentos próximos
exports.getRecebimentosProximos = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + parseInt(dias));
    
    const contas = await ContaReceber.findAll({
      where: {
        status: 'pendente',
        dataVencimento: {
          [Op.between]: [hoje.toISOString().split('T')[0], dataLimite.toISOString().split('T')[0]]
        }
      },
      order: [['dataVencimento', 'ASC']]
    });
    
    res.json({ success: true, data: contas });
  } catch (error) {
    console.error('Erro ao buscar recebimentos próximos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar recebimentos próximos', error: error.message });
  }
};

// Buscar clientes devedores
exports.getDevedores = async (req, res) => {
  try {
    const contas = await ContaReceber.findAll({
      where: {
        status: {
          [Op.in]: ['pendente', 'vencido']
        }
      },
      order: [['dataVencimento', 'ASC']]
    });
    
    // Agrupar por cliente
    const devedores = {};
    contas.forEach(conta => {
      const key = conta.clienteCpfCnpj || conta.clienteNome;
      if (!devedores[key]) {
        devedores[key] = {
          nome: conta.clienteNome,
          cpfCnpj: conta.clienteCpfCnpj,
          telefone: conta.clienteTelefone,
          totalDevido: 0,
          contas: []
        };
      }
      const saldo = parseFloat(conta.valor) - parseFloat(conta.valorRecebido);
      devedores[key].totalDevido += saldo;
      devedores[key].contas.push({
        id: conta.id,
        descricao: conta.descricao,
        valor: conta.valor,
        valorRecebido: conta.valorRecebido,
        saldo: saldo,
        dataVencimento: conta.dataVencimento,
        status: conta.status
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
