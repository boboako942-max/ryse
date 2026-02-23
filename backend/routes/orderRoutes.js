const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware, orderController.createOrder);
router.put('/:id', adminMiddleware, orderController.updateOrderStatus);
router.delete('/:id', authMiddleware, orderController.cancelOrder);
router.get('/admin/all', adminMiddleware, orderController.getAllOrders);

module.exports = router;
