const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', purchaseOrderController.createPurchaseOrder);
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);
router.patch('/:id/status', purchaseOrderController.updateStatus);
router.post('/:id/receive', purchaseOrderController.receiveOrder);
router.patch('/:id/cancel', purchaseOrderController.cancelOrder);

module.exports = router;
