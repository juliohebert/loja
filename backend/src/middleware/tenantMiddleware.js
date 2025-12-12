const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const tenantMiddleware = (req, res, next) => {
  try {
    // Rotas públicas que não precisam de tenantId
    const publicRoutes = [
      '/api/users/register',
      '/api/auth/register',
      '/api/auth/login',
      '/api/tenants', // Rotas de super-admin
      '/health',
      '/api-docs'
    ];

    // Verificar se a rota atual é pública
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
      // Para rotas públicas, usar tenantId padrão
      req.tenantId = 'default';
      return next();
    }

    // Tentar extrair tenantId do token JWT primeiro (para super-admin)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        try {
          const token = parts[1];
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.tenantId) {
            req.tenantId = decoded.tenantId;
            return next();
          }
        } catch (err) {
          // Se falhar ao decodificar, continua para tentar pegar do header
        }
      }
    }

    // Prioridade 2: Capturar o tenantId do cabeçalho
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      console.error('❌ Tenant ID não fornecido!', {
        path: req.path,
        method: req.method,
        headers: req.headers
      });
      return res.status(400).json({ error: 'Tenant ID não fornecido' });
    }

    // Adicionar o tenantId ao objeto req para uso posterior
    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro interno no middleware de tenant' });
  }
};

module.exports = tenantMiddleware;