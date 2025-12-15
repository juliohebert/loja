const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const { sequelize } = require('./models/Schema');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const cashRegisterRoutes = require('./routes/cashRegisterRoutes');
const configurationRoutes = require('./routes/configurationRoutes');
const userRoutes = require('./routes/userRoutes');
const saleRoutes = require('./routes/saleRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const accountPayableRoutes = require('./routes/accountPayableRoutes');
const accountReceivableRoutes = require('./routes/accountReceivableRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Importar rotas de assinatura
const planRoutes = require('./routes/planRoutes'); // Importar rotas de planos
const { initializeDefaultConfigurations } = require('./controllers/configurationController');
const { Client } = require('pg'); // Adicionar cliente do PostgreSQL para manipulação direta do banco
const tenantMiddleware = require('./middleware/tenantMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Permitir qualquer subdomínio do Vercel
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado para origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'no-origin'}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Middleware de log
app.use((req, res, next) => {
  next();
});


// Middleware para capturar o tenantId, exceto para /api/subscriptions/metrics

// Aplicar tenantMiddleware apenas nas rotas que precisam de tenantId
app.use('/api/products', tenantMiddleware);
app.use('/api/sales', tenantMiddleware);
app.use('/api/configurations', tenantMiddleware);
// NÃO aplicar tenant middleware em /api/users/register e /api/auth/*
app.use('/api/users', (req, res, next) => {
  console.log('🔍 Middleware /api/users - path:', req.path);
  // Pular tenant middleware para registro e algumas rotas de auth
  if (req.path === '/register' || req.path.startsWith('/auth')) {
    console.log('✅ Pulando tenant middleware para:', req.path);
    return next();
  }
  console.log('⚠️ Aplicando tenant middleware para:', req.path);
  return tenantMiddleware(req, res, next);
});
app.use('/api/suppliers', tenantMiddleware);
app.use('/api/purchase-orders', tenantMiddleware);
app.use('/api/accounts-payable', tenantMiddleware);
app.use('/api/accounts-receivable', tenantMiddleware);
app.use('/api/customers', tenantMiddleware);
app.use('/api/subscriptions', (req, res, next) => {
  if (req.path === '/metrics') return next();
  return tenantMiddleware(req, res, next);
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Loja de Roupas API',
}));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api', productRoutes);
app.use('/api', customerRoutes);
app.use('/api/cash-registers', cashRegisterRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/accounts-payable', accountPayableRoutes);
app.use('/api/accounts-receivable', accountReceivableRoutes);
app.use('/api/subscriptions', subscriptionRoutes); // Registrar rota de assinatura
app.use('/api/plans', planRoutes); // Registrar rota de planos

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Loja de Roupas API'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const createDatabaseIfNotExists = async (databaseName) => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [databaseName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${databaseName}`);
    } 
  } catch (error) {
    console.error(`❌ Erro ao verificar/criar banco de dados: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
};

// Sincronizar banco de dados e iniciar servidor
const startServer = async () => {
  try {
    // Verificar e criar banco de dados apenas se não estiver usando DATABASE_URL
    if (!process.env.DATABASE_URL) {
      const databaseName = process.env.DB_NAME;
      await createDatabaseIfNotExists(databaseName);
    }

    // Sincronizar modelos (usar force: true apenas em desenvolvimento para recriar tabelas)
    // await sequelize.sync({ alter: true }); // Removido para evitar conflitos com migrations
    
    // Inicializar configurações padrão com tenantId padrão
    await initializeDefaultConfigurations({ tenantId: 'default' });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
