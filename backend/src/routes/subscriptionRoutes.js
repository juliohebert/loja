const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Métricas agregadas para painel do super-admin
router.get('/metrics', subscriptionController.metrics);

// Todas as rotas protegidas e apenas para super-admin
router.use(authMiddleware, roleMiddleware('super-admin'));

router.get('/', subscriptionController.listAll);
router.post('/', subscriptionController.create);
router.put('/:id', subscriptionController.updateStatus);

module.exports = router;
