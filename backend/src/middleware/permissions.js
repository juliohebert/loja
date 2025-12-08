/**
 * Middleware de verificação de permissões
 * Verifica se o usuário tem permissão para executar determinada ação
 */

const checkPermission = (modulo, acao) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      // Admin tem acesso total
      if (user.funcao === 'admin') {
        return next();
      }

      // Verificar se usuário está ativo
      if (!user.ativo) {
        return res.status(403).json({
          success: false,
          error: 'Usuário desativado'
        });
      }

      // Verificar permissões personalizadas do usuário
      const permissoes = user.permissoes || {};
      
      if (permissoes[modulo] && permissoes[modulo][acao]) {
        return next();
      }

      // Sem permissão
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para executar esta ação',
        details: {
          modulo,
          acao,
          funcao: user.funcao
        }
      });

    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar se usuário é admin
 */
const isAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (user.funcao !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissões'
    });
  }
};

/**
 * Middleware para verificar se usuário é admin ou gerente
 */
const isAdminOrManager = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (user.funcao !== 'admin' && user.funcao !== 'gerente') {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores e gerentes'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissões'
    });
  }
};

module.exports = {
  checkPermission,
  isAdmin,
  isAdminOrManager
};
