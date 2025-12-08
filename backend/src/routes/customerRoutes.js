const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Cadastrar novo cliente
 *     description: Cria um novo cliente no sistema
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cpf
 *               - telefone
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do cliente
 *                 example: Maria Silva
 *               cpf:
 *                 type: string
 *                 description: CPF (apenas números)
 *                 example: 12345678900
 *               telefone:
 *                 type: string
 *                 description: Telefone com DDD
 *                 example: (11) 98765-4321
 *               email:
 *                 type: string
 *                 description: Email do cliente
 *                 example: maria@exemplo.com
 *               endereco:
 *                 type: string
 *                 description: Endereço completo
 *                 example: Rua das Flores, 123
 *               cidade:
 *                 type: string
 *                 description: Nome da cidade
 *                 example: São Paulo
 *               estado:
 *                 type: string
 *                 description: Sigla do estado (UF)
 *                 example: SP
 *               cep:
 *                 type: string
 *                 description: CEP
 *                 example: 01234-567
 *               limiteCredito:
 *                 type: number
 *                 description: Limite de crédito do cliente
 *                 example: 500.00
 *               observacoes:
 *                 type: string
 *                 description: Observações gerais
 *                 example: Cliente preferencial
 *     responses:
 *       201:
 *         description: Cliente cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente criado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Dados inválidos ou CPF já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   get:
 *     summary: Listar todos os clientes
 *     description: Retorna lista completa de clientes ativos
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clientes recuperados com sucesso
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 */
router.post('/customers', customerController.createCustomer);
router.get('/customers', customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Buscar cliente por ID
 *     description: Retorna detalhes de um cliente específico
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente recuperado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   put:
 *     summary: Atualizar cliente
 *     description: Atualiza dados cadastrais do cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo
 *               cpf:
 *                 type: string
 *                 description: CPF (apenas números)
 *               telefone:
 *                 type: string
 *                 description: Telefone
 *               email:
 *                 type: string
 *                 description: Email
 *               endereco:
 *                 type: string
 *                 description: Endereço
 *               cidade:
 *                 type: string
 *                 description: Cidade
 *               estado:
 *                 type: string
 *                 description: UF do estado
 *               cep:
 *                 type: string
 *                 description: CEP
 *               limiteCredito:
 *                 type: number
 *                 description: Limite de crédito
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   delete:
 *     summary: Remover cliente
 *     description: Remove cliente do sistema (soft delete). Não permite remoção se houver débito pendente.
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       400:
 *         description: Cliente possui débito pendente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get('/customers/:id', customerController.getCustomerById);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/transactions:
 *   post:
 *     summary: Registrar transação
 *     description: Adiciona débito, registra pagamento, ou ajusta limite de crédito
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - valor
 *               - data
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [adicionar, pagar, aumentar-credito, diminuir-credito]
 *                 description: Tipo de transação
 *                 example: adicionar
 *               valor:
 *                 type: number
 *                 description: Valor da transação
 *                 example: 150.00
 *               descricao:
 *                 type: string
 *                 description: Descrição da transação
 *                 example: Compra de roupas
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data da transação
 *                 example: 2025-12-06
 *     responses:
 *       201:
 *         description: Transação registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transação registrada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     transacao:
 *                       $ref: '#/components/schemas/TransacaoCliente'
 *                     cliente:
 *                       type: object
 *                       description: Dados atualizados do cliente
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   get:
 *     summary: Listar histórico de transações
 *     description: Retorna todas as transações de um cliente
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transações recuperadas com sucesso
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransacaoCliente'
 */
router.post('/customers/:id/transactions', customerController.addTransaction);
router.get('/customers/:id/transactions', customerController.getCustomerTransactions);

/**
 * @swagger
 * /api/customers/transactions/{transactionId}:
 *   delete:
 *     summary: Reverter transação
 *     description: Remove uma transação e reverte seus efeitos no saldo do cliente
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da transação
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Transação revertida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transação revertida com sucesso
 *                 data:
 *                   type: object
 *                   description: Dados atualizados do cliente
 *       404:
 *         description: Transação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.delete('/customers/transactions/:transactionId', customerController.deleteTransaction);

module.exports = router;
