const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Definição de permissões por role
 */
const PERMISSIONS = {
  admin: {
    produtos: { criar: true, editar: true, excluir: true, visualizar: true },
    estoque: { criar: true, editar: true, excluir: true, visualizar: true },
    vendas: { criar: true, editar: true, excluir: true, visualizar: true },
    financeiro: { criar: true, editar: true, excluir: true, visualizar: true },
    clientes: { criar: true, editar: true, excluir: true, visualizar: true },
    usuarios: { criar: true, editar: true, excluir: true, visualizar: true },
    relatorios: { visualizar: true },
    configuracoes: { editar: true },
    caixa: { abrir: true, fechar: true, visualizar: true }
  },
  gerente: {
    produtos: { criar: true, editar: true, excluir: false, visualizar: true },
    estoque: { criar: true, editar: true, excluir: false, visualizar: true },
    vendas: { criar: true, editar: true, excluir: false, visualizar: true },
    financeiro: { criar: true, editar: true, excluir: false, visualizar: true },
    clientes: { criar: true, editar: true, excluir: false, visualizar: true },
    usuarios: { criar: false, editar: false, excluir: false, visualizar: true },
    relatorios: { visualizar: true },
    configuracoes: { editar: false },
    caixa: { abrir: true, fechar: true, visualizar: true }
  },
  vendedor: {
    produtos: { criar: false, editar: false, excluir: false, visualizar: true },
    estoque: { criar: false, editar: false, excluir: false, visualizar: true },
    vendas: { criar: true, editar: false, excluir: false, visualizar: true },
    financeiro: { criar: false, editar: false, excluir: false, visualizar: false },
    clientes: { criar: true, editar: true, excluir: false, visualizar: true },
    usuarios: { criar: false, editar: false, excluir: false, visualizar: false },
    relatorios: { visualizar: false },
    configuracoes: { editar: false },
    caixa: { abrir: false, fechar: false, visualizar: false }
  }
};

/**
 * Listar todos os usuários
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nome', 'email', 'funcao', 'telefone', 'ativo', 'ultimoLogin', 'criado_em'],
      order: [['criado_em', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar usuários' 
    });
  }
};

/**
 * Buscar usuário por ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'nome', 'email', 'funcao', 'telefone', 'ativo', 'permissoes', 'ultimoLogin', 'criado_em']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar usuário' 
    });
  }
};

/**
 * Criar novo usuário
 * @route POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha, funcao, telefone, ativo } = req.body;

    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        success: false,
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Verificar se email já existe
    const emailExiste = await User.findOne({ where: { email } });
    if (emailExiste) {
      return res.status(400).json({ 
        success: false,
        error: 'Email já cadastrado' 
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Definir permissões padrão baseadas na função
    const permissoesDefault = PERMISSIONS[funcao || 'vendedor'] || PERMISSIONS.vendedor;

    // Criar usuário
    const user = await User.create({
      nome,
      email,
      senha: senhaHash,
      funcao: funcao || 'vendedor',
      telefone,
      ativo: ativo !== undefined ? ativo : true,
      permissoes: permissoesDefault
    });

    // Retornar sem a senha
    const userResponse = await User.findByPk(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: userResponse
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao criar usuário' 
    });
  }
};

/**
 * Atualizar usuário
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, funcao, telefone, ativo, permissoes } = req.body;

    const user = await User.scope('withPassword').findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    // Verificar se email já existe em outro usuário
    if (email && email !== user.email) {
      const emailExiste = await User.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({ 
          success: false,
          error: 'Email já cadastrado' 
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;
    if (funcao) updateData.funcao = funcao;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (permissoes) updateData.permissoes = permissoes;

    // Hash da nova senha se fornecida
    if (senha) {
      updateData.senha = await bcrypt.hash(senha, 10);
    }

    // Atualizar permissões se a função mudou
    if (funcao && funcao !== user.funcao) {
      updateData.permissoes = PERMISSIONS[funcao] || PERMISSIONS.vendedor;
    }

    await user.update(updateData);

    // Retornar usuário atualizado sem senha
    const userResponse = await User.findByPk(id);

    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: userResponse
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao atualizar usuário' 
    });
  }
};

/**
 * Excluir usuário (soft delete - desativa)
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    // Não permitir deletar o próprio usuário
    if (req.user && req.user.id === id) {
      return res.status(400).json({ 
        success: false,
        error: 'Você não pode desativar sua própria conta' 
      });
    }

    // Desativar ao invés de deletar
    await user.update({ ativo: false });

    res.status(200).json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao excluir usuário' 
    });
  }
};

/**
 * Reativar usuário
 * @route PATCH /api/users/:id/reactivate
 */
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    await user.update({ ativo: true });

    res.status(200).json({
      success: true,
      message: 'Usuário reativado com sucesso',
      data: user
    });
  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao reativar usuário' 
    });
  }
};

/**
 * Obter permissões de um usuário
 * @route GET /api/users/:id/permissions
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'nome', 'funcao', 'permissoes']
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        nome: user.nome,
        funcao: user.funcao,
        permissoes: user.permissoes || PERMISSIONS[user.funcao] || PERMISSIONS.vendedor
      }
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar permissões' 
    });
  }
};

/**
 * Atualizar permissões personalizadas de um usuário
 * @route PATCH /api/users/:id/permissions
 */
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissoes } = req.body;

    if (!permissoes || typeof permissoes !== 'object') {
      return res.status(400).json({ 
        success: false,
        error: 'Permissões inválidas' 
      });
    }

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    await user.update({ permissoes });

    res.status(200).json({
      success: true,
      message: 'Permissões atualizadas com sucesso',
      data: {
        userId: user.id,
        permissoes: user.permissoes
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao atualizar permissões' 
    });
  }
};

/**
 * Obter definição de permissões por role
 * @route GET /api/users/roles/permissions
 */
exports.getRolePermissions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: PERMISSIONS
    });
  } catch (error) {
    console.error('Erro ao buscar permissões de roles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar permissões' 
    });
  }
};

module.exports = exports;
