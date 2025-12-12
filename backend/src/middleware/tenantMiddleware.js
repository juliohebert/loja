const tenantMiddleware = (req, res, next) => {
  try {
    // Rotas públicas que não precisam de tenantId
    const publicRoutes = [
      '/api/users/register',
      '/api/auth/register',
      '/api/auth/login',
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

    // Capturar o tenantId do cabeçalho ou subdomínio
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