const User = require('../models/User');
const MasterStore = require('../models/MasterStore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createTenantDatabase } = require('../config/database');
const { exec } = require('child_process');
const transporter = require('../config/mailer');
const sendResendEmail = require('../config/resend');

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
    console.log('🔍 Buscando usuários para tenant:', req.tenantId);
    console.log('🔍 req.user:', req.user);
    
    // DEBUG: Buscar TODOS os usuários para ver o que tem no banco
    const todosUsuarios = await User.findAll({
      attributes: ['id', 'nome', 'email', 'tenant_id']
    });
    console.log('📊 TODOS os usuários no banco:', todosUsuarios.length);
    todosUsuarios.forEach(u => {
      console.log(`   - ${u.nome} (${u.email}) - tenant_id: ${u.tenant_id}`);
    });
    
    const users = await User.findAll({
      where: { tenant_id: req.tenantId }, // Filtrar pelo tenantId
      attributes: ['id', 'nome', 'email', 'funcao', 'telefone', 'ativo', 'ultimoLogin', 'criado_em', 'tenant_id'],
      order: [['criado_em', 'DESC']]
    });

    console.log('✅ Usuários encontrados para este tenant:', users.length);
    users.forEach(u => {
      console.log(`   ✓ ${u.nome} (${u.email}) - tenant_id: ${u.tenant_id}`);
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        funcao: u.funcao,
        telefone: u.telefone,
        ativo: u.ativo,
        ultimoLogin: u.ultimoLogin,
        criado_em: u.criado_em
      }))
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

    // Obter tenant_id do usuário logado
    console.log('🔍 DEBUG req.user:', req.user);
    console.log('🔍 DEBUG req.tenantId:', req.tenantId);
    
    const tenantId = req.user?.tenantId || req.tenantId;
    
    if (!tenantId) {
      console.error('❌ ERRO: tenant_id não encontrado!');
      return res.status(400).json({ 
        success: false,
        error: 'Erro ao identificar a loja. Faça login novamente.' 
      });
    }
    
    console.log('🔐 Criando usuário com tenant_id:', tenantId);

    // Criar usuário com tenant_id
    const user = await User.create({
      nome,
      email,
      senha: senhaHash,
      funcao: funcao || 'vendedor',
      telefone,
      ativo: ativo !== undefined ? ativo : true,
      permissoes: permissoesDefault,
      tenant_id: tenantId
    });

    console.log('✅ Usuário criado:', { id: user.id, nome: user.nome, tenant_id: user.tenant_id });

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

/**
 * Registrar uma nova loja
 * @route POST /api/users/register
 */
exports.registerStore = async (req, res) => {
  try {
    console.log('📥 Recebendo dados de registro:', req.body);
    const { nomeLoja, email, senha, cnpj, telefone, endereco, responsavel, plano } = req.body;

    // Validação básica
    if (!nomeLoja || !email || !senha) {
      console.log('❌ Validação falhou:', { nomeLoja, email, senha: !!senha });
      return res.status(400).json({ success: false, error: 'Nome da loja, email e senha são obrigatórios' });
    }

    // Gerar tenantId único baseado no nome da loja
    const tenantId = `tenant_${nomeLoja.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário administrador da loja
    const usuario = await User.create({
      nome: responsavel || nomeLoja,
      email,
      senha: senhaHash,
      funcao: 'admin', // campo correto para role
      ativo: true,
      tenant_id: tenantId // CORREÇÃO: usar tenant_id (com underscore)
    });

    console.log('✅ Usuário criado:', { id: usuario.id, email: usuario.email, tenantId });

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        funcao: usuario.funcao, // garantir que o token traga o campo correto
        tenantId: usuario.tenant_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: `Loja ${nomeLoja} registrada com sucesso!`,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao,
        tenantId: usuario.tenant_id,
        nomeLoja: nomeLoja // garantir que o frontend saiba o nome da clínica
      }
    });
  } catch (error) {
    console.error('❌ Erro ao registrar loja:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email já está em uso' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao registrar loja',
      details: error.message 
    });
  }
};

module.exports = exports;
