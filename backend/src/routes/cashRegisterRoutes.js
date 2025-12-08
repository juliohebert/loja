const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Caixas
 *   description: Gerenciamento de caixas (abertura, fechamento, consultas)
 */

/**
 * @swagger
 * /api/cash-registers/open:
 *   post:
 *     summary: Abrir um novo caixa
 *     tags: [Caixas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               saldoInicial:
 *                 type: number
 *                 description: Saldo inicial do caixa
 *                 example: 100.00
 *               observacoes:
 *                 type: string
 *                 description: Observações sobre a abertura do caixa
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 *       400:
 *         description: Já existe um caixa aberto
 */
router.post('/open', authMiddleware, cashRegisterController.openCashRegister);

/**
 * @swagger
 * /api/cash-registers/{id}/close:
 *   put:
 *     summary: Fechar um caixa
 *     tags: [Caixas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saldoFinal
 *             properties:
 *               saldoFinal:
 *                 type: number
 *                 description: Saldo final do caixa
 *                 example: 850.50
 *               observacoes:
 *                 type: string
 *                 description: Observações sobre o fechamento
 *     responses:
 *       200:
 *         description: Caixa fechado com sucesso
 *       404:
 *         description: Caixa não encontrado
 */
router.put('/:id/close', authMiddleware, cashRegisterController.closeCashRegister);

/**
 * @swagger
 * /api/cash-registers/open/current:
 *   get:
 *     summary: Buscar caixa aberto do usuário atual
 *     tags: [Caixas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caixa aberto encontrado
 *       404:
 *         description: Nenhum caixa aberto
 */
router.get('/open/current', authMiddleware, cashRegisterController.getOpenCashRegister);

/**
 * @swagger
 * /api/cash-registers:
 *   get:
 *     summary: Listar todos os caixas
 *     tags: [Caixas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aberto, fechado]
 *         description: Filtrar por status
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de caixas
 */
router.get('/', authMiddleware, cashRegisterController.getAllCashRegisters);

/**
 * @swagger
 * /api/cash-registers/{id}:
 *   get:
 *     summary: Buscar caixa por ID
 *     tags: [Caixas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *     responses:
 *       200:
 *         description: Caixa encontrado
 *       404:
 *         description: Caixa não encontrado
 */
router.get('/:id', authMiddleware, cashRegisterController.getCashRegisterById);

module.exports = router;
