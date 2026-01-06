const { User } = require('../models/Schema');

/**
 * ENDPOINT TEMPORÁRIO DE ADMIN
 * Corrige usuários sem tenant_id
 * DELETE DEPOIS DE USAR!
 */
exports.fixUserTenants = async (req, res) => {
  try {
    // Verificar se é super-admin
    if (req.user.funcao !== 'super-admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar usuários sem tenant_id
    const usersWithoutTenant = await User.findAll({
      where: { tenant_id: null },
      attributes: ['id', 'nome', 'email', 'funcao']
    });

    console.log(`Encontrados ${usersWithoutTenant.length} usuários sem tenant_id`);

    // Atualizar para 'default'
    const [updatedCount] = await User.update(
      { tenant_id: 'default' },
      { where: { tenant_id: null } }
    );

    res.status(200).json({
      message: 'Usuários atualizados com sucesso',
      usersFound: usersWithoutTenant.length,
      usersUpdated: updatedCount,
      users: usersWithoutTenant.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        funcao: u.funcao
      }))
    });

  } catch (error) {
    console.error('Erro ao corrigir tenant dos usuários:', error);
    res.status(500).json({ error: error.message });
  }
};
