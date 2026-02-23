const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', adminMiddleware, categoryController.createCategory);
router.put('/:id', adminMiddleware, categoryController.updateCategory);
router.delete('/:id', adminMiddleware, categoryController.deleteCategory);

module.exports = router;
