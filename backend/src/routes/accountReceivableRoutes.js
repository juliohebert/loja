const express = require('express');
const router = express.Router();
const accountReceivableController = require('../controllers/accountReceivableController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', accountReceivableController.createAccountReceivable);
router.get('/', accountReceivableController.getAccountsReceivable);
router.get('/upcoming', accountReceivableController.getUpcomingReceivables);
router.get('/debtors', accountReceivableController.getDebtors);
router.get('/:id', accountReceivableController.getAccountReceivableById);
router.post('/:id/receive', accountReceivableController.receivePayment);
router.patch('/:id/cancel', accountReceivableController.cancelAccount);

module.exports = router;
