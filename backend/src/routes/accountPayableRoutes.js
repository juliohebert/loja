const express = require('express');
const router = express.Router();
const accountPayableController = require('../controllers/accountPayableController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', accountPayableController.createContaPagar);
router.get('/', accountPayableController.getContasPagar);
router.get('/upcoming', accountPayableController.getPagamentosProximos);
router.get('/:id', accountPayableController.getContaPagarById);
router.put('/:id', accountPayableController.updateContaPagar);
router.delete('/:id', accountPayableController.inativarContaPagar);
router.post('/:id/pay', accountPayableController.pagarConta);
router.patch('/:id/cancel', accountPayableController.cancelarConta);

module.exports = router;
