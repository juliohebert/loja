const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');

/**
 * Rotas Públicas do Catálogo (sem autenticação)
 * Base: /api/catalogo
 */

// Listar produtos disponíveis no catálogo (rota padrão com header x-tenant-id)
router.get('/produtos', catalogoController.listarProdutosCatalogo);

// Listar produtos por slug da loja
router.get('/:slug/produtos', catalogoController.listarProdutosCatalogoPorSlug);

// Obter detalhes de um produto específico (rota padrão)
router.get('/produtos/:id', catalogoController.obterDetalheProduto);

// Obter detalhes de um produto por slug da loja
router.get('/:slug/produtos/:id', catalogoController.obterDetalheProdutoPorSlug);

// Criar novo pedido do catálogo (rota padrão)
router.post('/pedidos', catalogoController.criarPedidoCatalogo);

// Criar pedido por slug da loja
router.post('/:slug/pedidos', catalogoController.criarPedidoCatalogoPorSlug);

// Obter configurações públicas (WhatsApp, nome da loja, etc) - rota padrão
router.get('/configuracoes', catalogoController.obterConfiguracoesCatalogo);

// Obter configurações por slug da loja
router.get('/:slug/configuracoes', catalogoController.obterConfiguracoesCatalogoPorSlug);

module.exports = router;
