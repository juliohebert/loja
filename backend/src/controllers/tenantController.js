const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const User = require('../models/User');

/**
 * Listar todos os tenants
 * @route GET /api/tenants
 * @access Super Admin only
 */
const getAllTenants = async (req, res) => {
  try {
    // Verificar se é super-admin
    if (req.user.funcao !== 'super-admin') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas super-administradores podem acessar esta funcionalidade.' 
      });
    }

    // Buscar todos os tenants únicos
    const tenants = await User.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('tenant_id')), 'tenantId']
      ],
      where: {
        tenantId: { [Op.ne]: null }
      },
      raw: true
    });

    // Para cada tenant, buscar informações adicionais
    const tenantsWithInfo = await Promise.all(
      tenants.map(async (tenant) => {
        // Buscar primeiro usuário admin do tenant para pegar nome da loja
        const adminUser = await User.findOne({
          where: { 
            tenantId: tenant.tenantId,
            funcao: 'admin'
          },
          attributes: ['id', 'nome', 'email', 'criado_em']
        });

        // Contar usuários do tenant
        const userCount = await User.count({
          where: { tenantId: tenant.tenantId }
        });

        return {
          tenantId: tenant.tenantId,
          nomeLoja: adminUser ? `Loja de ${adminUser.nome}` : tenant.tenantId,
          adminEmail: adminUser?.email,
          criadoEm: adminUser?.criado_em,
          totalUsuarios: userCount
        };
      })
    );

    res.status(200).json({
      message: 'Tenants recuperados com sucesso',
      data: tenantsWithInfo,
      total: tenantsWithInfo.length
    });

  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar tenants',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obter informações de um tenant específico
 * @route GET /api/tenants/:tenantId
 * @access Super Admin only
 */
const getTenantById = async (req, res) => {
  try {
    // Verificar se é super-admin
    if (req.user.funcao !== 'super-admin') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas super-administradores podem acessar esta funcionalidade.' 
      });
    }

    const { tenantId } = req.params;

    // Buscar usuários do tenant
    const users = await User.findAll({
      where: { tenantId },
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo', 'criado_em', 'ultimo_login']
    });

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant não encontrado' 
      });
    }

    const adminUser = users.find(u => u.funcao === 'admin');

    res.status(200).json({
      message: 'Informações do tenant recuperadas com sucesso',
      data: {
        tenantId,
        nomeLoja: adminUser ? `Loja de ${adminUser.nome}` : tenantId,
        adminEmail: adminUser?.email,
        totalUsuarios: users.length,
        usuarios: users
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar tenant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Gerar token para acessar um tenant específico
 * @route POST /api/tenants/:tenantId/access
 * @access Super Admin only
 */
const accessTenant = async (req, res) => {
  try {
    // Verificar se é super-admin
    if (req.user.funcao !== 'super-admin') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas super-administradores podem acessar esta funcionalidade.' 
      });
    }

    const { tenantId } = req.params;
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_super_seguro_aqui';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    // Verificar se tenant existe
    const tenantExists = await User.findOne({ where: { tenantId } });
    
    if (!tenantExists) {
      return res.status(404).json({ 
        error: 'Tenant não encontrado' 
      });
    }

    // Gerar token especial com acesso ao tenant
    const token = jwt.sign(
      { 
        id: req.user.id,
        email: req.user.email,
        funcao: 'super-admin',
        tenantId: tenantId, // Acesso temporário ao tenant
        isSuperAdminAccess: true
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Token de acesso gerado com sucesso',
      token,
      tenantId
    });

  } catch (error) {
    console.error('Erro ao gerar token de acesso:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar token de acesso',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  accessTenant
};

