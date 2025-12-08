const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de usuários
router.get('/', userController.getAllUsers);
router.get('/roles/permissions', userController.getRolePermissions);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/reactivate', userController.reactivateUser);
router.get('/:id/permissions', userController.getUserPermissions);
router.patch('/:id/permissions', userController.updateUserPermissions);

module.exports = router;
