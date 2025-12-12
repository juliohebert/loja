const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_super_seguro_aqui';

/**
 * Middleware para verificar autenticação JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];

    // Verificar token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('❌ Erro ao verificar token:', err.message);
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      // Adicionar informações do usuário na requisição
      req.user = {
        id: decoded.id,
        email: decoded.email,
        funcao: decoded.funcao || decoded.tipo_usuario || decoded.role, // suporte para tokens antigos
        tenantId: decoded.tenantId, // Incluir tenantId do token
        isSuperAdminAccess: decoded.isSuperAdminAccess || false // Flag de acesso super-admin
      };

      console.log('✅ Token verificado com sucesso:', {
        id: decoded.id,
        email: decoded.email,
        funcao: decoded.funcao || decoded.tipo_usuario || decoded.role,
        tenantId: decoded.tenantId,
        isSuperAdminAccess: decoded.isSuperAdminAccess || false
      });

      // Adicionar tenantId do token ao req (sobrescreve o do middleware de tenant se existir)
      if (decoded.tenantId) {
        req.tenantId = decoded.tenantId;
      }

      next();
    });

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao processar autenticação' });
  }
};

/**
 * Middleware para verificar role do usuário
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!allowedRoles.includes(req.user.funcao)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente' });
    }

    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
