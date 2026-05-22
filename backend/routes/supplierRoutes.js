const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersByCategory,
  getPendingSuppliers,
  getApprovedSuppliers,
  approveSupplier,
  getMyProducts,
  addMyProduct,
  updateMyProduct,
  deleteMyProduct,
  getMyOrders,
  dispatchOrder,
  getLowStockAlerts,
  sendRestockRequest,
  getMyStockRequests,
  updateMyStockRequestStatus,
  getMyProfile,
  updateMyProfile
} = require('../controllers/supplierController');
const { protect, admin, supplier } = require('../middleware/authMiddleware');

// ---- Admin Routes (existing + new) ----
router.get('/', protect, admin, getSuppliers);
router.get('/pending', protect, admin, getPendingSuppliers);
router.get('/approved', protect, admin, getApprovedSuppliers);
router.get('/by-category/:category', protect, admin, getSuppliersByCategory);
router.post('/', protect, admin, createSupplier);
router.put('/:id/approve', protect, admin, approveSupplier);
router.put('/:id', protect, admin, updateSupplier);
router.delete('/:id', protect, admin, deleteSupplier);
router.get('/:id', protect, admin, getSupplierById);

// ---- Supplier Dashboard Routes ----
router.get('/my/products', protect, supplier, getMyProducts);
router.post('/my/products', protect, supplier, addMyProduct);
router.put('/my/products/:id', protect, supplier, updateMyProduct);
router.delete('/my/products/:id', protect, supplier, deleteMyProduct);

router.get('/my/orders', protect, supplier, getMyOrders);
router.put('/my/orders/:id/dispatch', protect, supplier, dispatchOrder);

router.get('/my/alerts', protect, supplier, getLowStockAlerts);
router.post('/my/restock', protect, supplier, sendRestockRequest);

router.get('/my/stock-requests', protect, supplier, getMyStockRequests);
router.put('/my/stock-requests/:id/status', protect, supplier, updateMyStockRequestStatus);

router.get('/my/profile', protect, supplier, getMyProfile);
router.put('/my/profile', protect, supplier, updateMyProfile);

module.exports = router;
