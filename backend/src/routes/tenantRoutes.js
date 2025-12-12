const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route GET /api/tenants
 * @desc Listar todos os tenants
 * @access Super Admin
 */
router.get('/', authMiddleware, tenantController.getAllTenants);

/**
 * @route GET /api/tenants/:tenantId
 * @desc Obter informações de um tenant específico
 * @access Super Admin
 */
router.get('/:tenantId', authMiddleware, tenantController.getTenantById);

/**
 * @route POST /api/tenants/:tenantId/access
 * @desc Gerar token para acessar um tenant
 * @access Super Admin
 */
router.post('/:tenantId/access', authMiddleware, tenantController.accessTenant);

module.exports = router;
