const { Customer, CustomerTransaction } = require('../models/Schema');
const { Op } = require('sequelize');

/**
 * Criar novo cliente
 */
exports.createCustomer = async (req, res) => {
  try {
    const { nome, cpf, telefone, email, endereco, cidade, estado, cep, limiteCredito, observacoes } = req.body;

    // Validar campos obrigatórios
    if (!nome || !cpf || !telefone) {
      return res.status(400).json({ 
        error: 'Nome, CPF e telefone são obrigatórios' 
      });
    }

    // Verificar se CPF já existe
    const clienteExistente = await Customer.findOne({ 
      where: { 
        cpf,
        tenant_id: req.tenantId 
      } 
    });
    if (clienteExistente) {
      return res.status(400).json({ 
        error: 'CPF já cadastrado' 
      });
    }

    // Criar cliente
    const cliente = await Customer.create({
      nome,
      cpf,
      telefone,
      email: email || null,
      endereco: endereco || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
      debito: 0,
      limiteCredito: limiteCredito || 0,
      observacoes: observacoes || null,
      tenant_id: req.tenantId
    });

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ 
      error: 'Erro ao criar cliente',
      details: error.message 
    });
  }
};

/**
 * Listar todos os clientes
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const clientes = await Customer.findAll({
      where: { 
        ativo: true,
        tenant_id: req.tenantId 
      },
      order: [['nome', 'ASC']],
      include: [{
        model: CustomerTransaction,
        as: 'transacoes',
        order: [['dataHora', 'DESC']],
        limit: 5
      }]
    });

    res.status(200).json({
      message: 'Clientes recuperados com sucesso',
      data: clientes
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ 
      error: 'Erro ao listar clientes',
      details: error.message 
    });
  }
};

/**
 * Buscar cliente por ID
 */
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Customer.findOne({
      where: { 
        id,
        tenant_id: req.tenantId 
      },
      include: [{
        model: CustomerTransaction,
        as: 'transacoes',
        order: [['dataHora', 'DESC']]
      }]
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.status(200).json({
      message: 'Cliente recuperado com sucesso',
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar cliente',
      details: error.message 
    });
  }
};

/**
 * Atualizar cliente
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, telefone, email, endereco, cidade, estado, cep, limiteCredito, observacoes } = req.body;

    const cliente = await Customer.findOne({ 
      where: { 
        id,
        tenant_id: req.tenantId 
      } 
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se CPF foi alterado e se já existe
    if (cpf && cpf !== cliente.cpf) {
      const cpfExistente = await Customer.findOne({ 
        where: { 
          cpf,
          tenant_id: req.tenantId,
          id: { [Op.ne]: id }
        } 
      });
      
      if (cpfExistente) {
        return res.status(400).json({ error: 'CPF já cadastrado para outro cliente' });
      }
    }

    // Atualizar cliente
    await cliente.update({
      nome: nome || cliente.nome,
      cpf: cpf || cliente.cpf,
      telefone: telefone || cliente.telefone,
      email: email !== undefined ? email : cliente.email,
      endereco: endereco !== undefined ? endereco : cliente.endereco,
      cidade: cidade !== undefined ? cidade : cliente.cidade,
      estado: estado !== undefined ? estado : cliente.estado,
      cep: cep !== undefined ? cep : cliente.cep,
      limiteCredito: limiteCredito !== undefined ? limiteCredito : cliente.limiteCredito,
      observacoes: observacoes !== undefined ? observacoes : cliente.observacoes
    });

    res.status(200).json({
      message: 'Cliente atualizado com sucesso',
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar cliente',
      details: error.message 
    });
  }
};

/**
 * Deletar cliente (soft delete)
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Customer.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se tem débito pendente
    if (cliente.debito > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cliente com débito pendente',
        debito: cliente.debito
      });
    }

    // Soft delete
    await cliente.update({ active: false });

    res.status(200).json({
      message: 'Cliente deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar cliente',
      details: error.message 
    });
  }
};

/**
 * Adicionar transação (débito/crédito)
 */
exports.addTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, valor, descricao, data } = req.body;

    // Validar campos obrigatórios
    if (!tipo || !valor || !data) {
      return res.status(400).json({ 
        error: 'Tipo, valor e data são obrigatórios' 
      });
    }

    // Validar tipo
    const tiposValidos = ['adicionar', 'pagar', 'aumentar-credito', 'diminuir-credito'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo inválido. Use: adicionar, pagar, aumentar-credito ou diminuir-credito' 
      });
    }

    const cliente = await Customer.findOne({ 
      where: { 
        id,
        tenant_id: req.tenantId 
      } 
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const valorNum = parseFloat(valor);
    if (valorNum <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    // Criar transação
    const transacao = await CustomerTransaction.create({
      customer_id: id,
      tipo,
      valor: valorNum,
      descricao: descricao || null,
      data,
      dataHora: new Date()
    });

    // Atualizar débito ou crédito do cliente
    let novoDebito = cliente.debito;
    let novoLimiteCredito = cliente.limiteCredito;

    switch (tipo) {
      case 'adicionar':
        novoDebito = parseFloat(cliente.debito) + valorNum;
        break;
      case 'pagar':
        novoDebito = Math.max(0, parseFloat(cliente.debito) - valorNum);
        break;
      case 'aumentar-credito':
        novoLimiteCredito = parseFloat(cliente.limiteCredito) + valorNum;
        break;
      case 'diminuir-credito':
        novoLimiteCredito = Math.max(0, parseFloat(cliente.limiteCredito) - valorNum);
        break;
    }

    await cliente.update({
      debito: novoDebito,
      limiteCredito: novoLimiteCredito
    });

    res.status(201).json({
      message: 'Transação registrada com sucesso',
      data: {
        transacao,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          debito: cliente.debito,
          limiteCredito: cliente.limiteCredito,
          creditoDisponivel: cliente.calculateAvailableCredit()
        }
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
    res.status(500).json({ 
      error: 'Erro ao adicionar transação',
      details: error.message 
    });
  }
};

/**
 * Listar transações de um cliente
 */
exports.getCustomerTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Customer.findOne({ 
      where: { 
        id,
        tenant_id: req.tenantId 
      } 
    });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const transacoes = await CustomerTransaction.findAll({
      where: { customer_id: id },
      order: [['dataHora', 'DESC']]
    });

    res.status(200).json({
      message: 'Transações recuperadas com sucesso',
      data: transacoes
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ 
      error: 'Erro ao listar transações',
      details: error.message 
    });
  }
};

/**
 * Deletar/reverter transação
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transacao = await CustomerTransaction.findByPk(transactionId);
    
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const cliente = await Customer.findByPk(transacao.customer_id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Reverter operação no cliente
    const valorNum = parseFloat(transacao.valor);
    let novoDebito = cliente.debito;
    let novoLimiteCredito = cliente.limiteCredito;

    switch (transacao.tipo) {
      case 'adicionar':
        novoDebito = Math.max(0, parseFloat(cliente.debito) - valorNum);
        break;
      case 'pagar':
        novoDebito = parseFloat(cliente.debito) + valorNum;
        break;
      case 'aumentar-credito':
        novoLimiteCredito = Math.max(0, parseFloat(cliente.limiteCredito) - valorNum);
        break;
      case 'diminuir-credito':
        novoLimiteCredito = parseFloat(cliente.limiteCredito) + valorNum;
        break;
    }

    await cliente.update({
      debito: novoDebito,
      limiteCredito: novoLimiteCredito
    });

    // Deletar transação
    await transacao.destroy();

    res.status(200).json({
      message: 'Transação revertida com sucesso',
      data: {
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          debito: cliente.debito,
          limiteCredito: cliente.limiteCredito,
          creditoDisponivel: cliente.calculateAvailableCredit()
        }
      }
    });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar transação',
      details: error.message 
    });
  }
};
