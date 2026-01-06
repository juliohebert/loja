console.log('=== TESTE DE IMPORTAÇÃO ===\n');

console.log('1. Carregando tenantController...');
const tenantController = require('./src/controllers/tenantController');
console.log('✓ tenantController carregado');
console.log('Exports:', Object.keys(tenantController));
console.log('getAllTenants type:', typeof tenantController.getAllTenants);
console.log('getTenantById type:', typeof tenantController.getTenantById);
console.log('accessTenant type:', typeof tenantController.accessTenant);

console.log('\n2. Carregando tenantRoutes...');
try {
  const tenantRoutes = require('./src/routes/tenantRoutes');
  console.log('✓ tenantRoutes carregado com sucesso!');
} catch (error) {
  console.error('✗ Erro ao carregar tenantRoutes:', error.message);
  console.error('Stack:', error.stack);
}
