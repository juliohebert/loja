const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authMiddleware } = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de vendas
router.get('/', saleController.getAllSales);
router.get('/period', saleController.getSalesByPeriod);
router.get('/vendedor/:vendedor', saleController.getSalesByVendedor);
router.get('/:id', saleController.getSaleById);
router.post('/', saleController.createSale);
router.post('/catalogo', saleController.createSaleFromCatalog);
router.post('/:id/cancel', saleController.cancelSale);

module.exports = router;
