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
const { initializeDefaultConfigurations } = require('./controllers/configurationController');
const { Client } = require('pg'); // Adicionar cliente do PostgreSQL para manipulação direta do banco
const tenantMiddleware = require('./middleware/tenantMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Body:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

// Middleware para capturar o tenantId
app.use(tenantMiddleware);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Loja de Roupas API',
}));

// Rotas
app.use('/api/auth', authRoutes);
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
      console.log(`🛠️  Criando banco de dados: ${databaseName}`);
      await client.query(`CREATE DATABASE ${databaseName}`);
      console.log(`✅ Banco de dados ${databaseName} criado com sucesso!`);
    } else {
      console.log(`📂 Banco de dados ${databaseName} já existe.`);
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
    // Verificar e criar banco de dados, se necessário
    const databaseName = process.env.DB_NAME;
    await createDatabaseIfNotExists(databaseName);

    // Sincronizar modelos (usar force: true apenas em desenvolvimento para recriar tabelas)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados');
    
    // Inicializar configurações padrão com tenantId padrão
    await initializeDefaultConfigurations({ tenantId: 'default' });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
