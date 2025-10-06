const express = require('express');
const router = express.Router();
const productController = require('../../../controllers/super-admin/productController');
const { auth } = require('../../../middleware/auth');

// Product routes (Database-driven)
router.get('/', auth, productController.getAllProducts);
router.get('/stats', auth, productController.getProductStats);
router.get('/filters', auth, productController.getFilterOptions);
router.get('/categories', auth, productController.getCategories);
router.get('/brands', auth, productController.getBrands);
router.get('/:id', auth, productController.getProductById);
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
