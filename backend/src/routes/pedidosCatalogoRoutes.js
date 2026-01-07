const express = require('express');
const router = express.Router();
const pedidosCatalogoController = require('../controllers/pedidosCatalogoController');
const { authMiddleware } = require('../middleware/auth');

/**
 * Rotas de Gestão de Pedidos do Catálogo (área administrativa)
 * Base: /api/pedidos-catalogo
 * Todas as rotas requerem autenticação
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Obter estatísticas dos pedidos
router.get('/estatisticas', pedidosCatalogoController.obterEstatisticasPedidos);

// Listar todos os pedidos (com filtros e paginação)
router.get('/', pedidosCatalogoController.listarPedidos);

// Obter detalhes de um pedido específico
router.get('/:id', pedidosCatalogoController.obterDetalhePedido);

// Atualizar status de um pedido
router.patch('/:id/status', pedidosCatalogoController.atualizarStatusPedido);

// Atualizar dados do cliente ou observações
router.patch('/:id', pedidosCatalogoController.atualizarPedido);

// Deletar (cancelar) um pedido
router.delete('/:id', pedidosCatalogoController.deletarPedido);

module.exports = router;
