const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const fixTenantController = require('../controllers/fixTenantController');

/**
 * @route POST /api/admin/fix-user-tenants
 * @desc Corrige usuários sem tenant_id (TEMPORÁRIO - DELETE DEPOIS!)
 * @access Super-admin only
 */
router.post(
  '/fix-user-tenants',
  authMiddleware,
  roleMiddleware('super-admin'),
  fixTenantController.fixUserTenants
);

module.exports = router;
