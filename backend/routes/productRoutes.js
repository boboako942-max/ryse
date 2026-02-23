const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', adminMiddleware, productController.createProduct);
router.put('/:id', adminMiddleware, productController.updateProduct);
router.delete('/:id', adminMiddleware, productController.deleteProduct);
router.post('/:id/review', authMiddleware, productController.addReview);

module.exports = router;
