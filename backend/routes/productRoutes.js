const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getAdminProducts,
  getAdminProductsForSuppliers,
  getTopRatedProducts, 
  getProductById,
  getAdminProductById,
  createProduct, 
  updateProduct, 
  deleteProduct,
  restoreProduct,
  toggleAvailability,
  getRemovedProducts,
  getCategories,
  getVehicleBrands,
  getCategoryStats
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const uploadProductImage = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/admin-list', getAdminProductsForSuppliers);
router.get('/top-rated', getTopRatedProducts);
router.get('/admin/removed', protect, admin, getRemovedProducts);
router.get('/admin/:id', protect, admin, getAdminProductById);
router.get('/categories', getCategories);
router.get('/brands', getVehicleBrands);
router.get('/category-stats', getCategoryStats);
router.get('/:id', getProductById);
router.post('/', protect, admin, uploadProductImage, createProduct);
router.put('/:id', protect, admin, uploadProductImage, updateProduct);
router.patch('/:id/toggle-availability', protect, admin, toggleAvailability);
router.patch('/:id/restore', protect, admin, restoreProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
