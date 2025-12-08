const express = require('express');
const router = express.Router();
const accountPayableController = require('../controllers/accountPayableController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', accountPayableController.createAccountPayable);
router.get('/', accountPayableController.getAccountsPayable);
router.get('/upcoming', accountPayableController.getUpcomingPayments);
router.get('/:id', accountPayableController.getAccountPayableById);
router.post('/:id/pay', accountPayableController.payAccount);
router.patch('/:id/cancel', accountPayableController.cancelAccount);

module.exports = router;
