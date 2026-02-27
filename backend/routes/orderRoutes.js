const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Admin routes (must come before :id routes)
router.get('/admin/all', adminMiddleware, orderController.getAllOrders);

// User routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.put('/:id', adminMiddleware, orderController.updateOrderStatus);
router.delete('/:id', authMiddleware, orderController.cancelOrder);

module.exports = router;
