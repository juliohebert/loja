const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { Configuration } = require('../models/Schema');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_super_seguro_aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Registrar novo usuário (cria automaticamente um tenant único para a loja)
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, funcao, nomeLoja } = req.body;

    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, email, senha' 
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Este e-mail já está cadastrado' 
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    // Gerar tenant_id único para esta loja
    const tenantId = uuidv4();
    
    console.log(`🏪 Criando nova loja com tenant_id: ${tenantId}`);

    // Criar usuário com tenant_id único
    const user = await User.create({
      nome,
      email: email.toLowerCase(),
      senha: hashedPassword,
      funcao: funcao || 'admin', // Primeiro usuário da loja é admin por padrão
      tenant_id: tenantId
    });

    // Criar configurações padrão para esta loja
    await Configuration.create({
      chave: 'nome_loja',
      valor: nomeLoja || `Loja de ${nome}`,
      tipo: 'texto',
      descricao: 'Nome da loja',
      tenant_id: tenantId
    });

    await Configuration.create({
      chave: 'exigir_caixa_aberto',
      valor: 'false',
      tipo: 'booleano',
      descricao: 'Exigir caixa aberto para realizar vendas',
      tenant_id: tenantId
    });

    console.log(`✅ Loja criada com sucesso! Tenant: ${tenantId}`);

    // Gerar token JWT com tenantId
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        funcao: user.funcao,
        tenantId: tenantId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Loja criada com sucesso! Você é o administrador.',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
        tenantId: tenantId
      },
      token
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login de usuário
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validações
    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'E-mail e senha são obrigatórios' 
      });
    }

    // Buscar usuário com senha
    const user = await User.scope('withPassword').findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'E-mail ou senha incorretos' 
      });
    }

    // Verificar se usuário está ativo
    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Conta desativada. Entre em contato com o administrador' 
      });
    }

    // Comparar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'E-mail ou senha incorretos' 
      });
    }

    // Atualizar último login
    await user.update({ ultimoLogin: new Date() });

    // Gerar token JWT com permissões e tenantId
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        funcao: user.funcao,
        permissoes: user.permissoes,
        ativo: user.ativo,
        tenantId: user.tenant_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('Login realizado com sucesso para o usuário:', email);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
        permissoes: user.permissoes
      },
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ 
      error: 'Erro ao processar login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Solicitar reset de senha
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'E-mail é obrigatório' 
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Por segurança, retornar sucesso mesmo se usuário não existir
      return res.status(200).json({ 
        message: 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha' 
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token válido por 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await user.update({
      tokenRecuperacao: hashedToken,
      tokenRecuperacaoExpira: expiresAt
    });

    // TODO: Enviar e-mail com o link de reset
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // await sendEmail(user.email, 'Reset de Senha', resetUrl);

    console.log(`🔑 Token de reset gerado para ${user.email}: ${resetToken}`);
    console.log(`Link de reset: http://localhost:3000/reset-password/${resetToken}`);

    res.status(200).json({ 
      message: 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha',
      // Em desenvolvimento, retornar o token (REMOVER EM PRODUÇÃO)
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({ 
      error: 'Erro ao processar solicitação',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Redefinir senha com token
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ 
        error: 'Token e nova senha são obrigatórios' 
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Hash do token recebido
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuário com token válido
    const user = await User.scope('withPassword').findOne({
      where: {
        tokenRecuperacao: hashedToken,
        tokenRecuperacaoExpira: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);

    // Atualizar senha e limpar token
    await user.update({
      senha: hashedPassword,
      tokenRecuperacao: null,
      tokenRecuperacaoExpira: null
    });

    res.status(200).json({ 
      message: 'Senha redefinida com sucesso. Você já pode fazer login' 
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ 
      error: 'Erro ao redefinir senha',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verificar token JWT
 * @route GET /api/auth/me
 */
exports.verifyToken = async (req, res) => {
  try {
    // Token já foi validado pelo middleware
    const user = await User.findByPk(req.user.id);

    if (!user || !user.ativo) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao
      }
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

module.exports = exports;
