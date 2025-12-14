const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Rota pública para listar planos disponíveis (sem auth)
router.get('/available', planController.getAvailablePlans);

// Todas as rotas abaixo requerem autenticação e permissão de admin
router.use(authMiddleware, roleMiddleware('super-admin'));

// Listar todos os planos
router.get('/', planController.getAllPlans);

// Buscar plano por ID
router.get('/:id', planController.getPlanById);

// Criar novo plano
router.post('/', planController.createPlan);

// Atualizar plano
router.put('/:id', planController.updatePlan);

// Deletar plano
router.delete('/:id', planController.deletePlan);

// Ativar/desativar plano
router.patch('/:id/toggle-status', planController.togglePlanStatus);

module.exports = router;
