const express = require('express');
const router = express.Router();
const accountReceivableController = require('../controllers/accountReceivableController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', accountReceivableController.createContaReceber);
router.get('/', accountReceivableController.getContasReceber);
router.get('/upcoming', accountReceivableController.getRecebimentosProximos);
router.get('/debtors', accountReceivableController.getDevedores);
router.get('/:id', accountReceivableController.getContaReceberById);
router.post('/:id/receive', accountReceivableController.receberPagamento);
router.patch('/:id/cancel', accountReceivableController.cancelarConta);

module.exports = router;
