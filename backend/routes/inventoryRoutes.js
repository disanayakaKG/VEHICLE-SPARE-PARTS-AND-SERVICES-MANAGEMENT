const express = require('express');
const router = express.Router();
const { 
  getInventory, 
  getLowStockAlerts,
  getInventoryByProduct,
  createInventory, 
  deleteInventoryItem,
  updateStock,
  getInventoryLogs,
  getInventoryReport,
  createStockRequest,
  getStockRequests,
  getStockRequestById,
  updateStockRequestStatus,
  receiveStock
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Inventory routes
router.get('/', protect, admin, getInventory);
router.get('/alerts', protect, admin, getLowStockAlerts);
router.get('/report', protect, admin, getInventoryReport);
router.get('/product/:productId', protect, admin, getInventoryByProduct);
router.get('/logs/:productId', protect, admin, getInventoryLogs);
router.post('/', protect, admin, createInventory);
router.delete('/:id', protect, admin, deleteInventoryItem);
router.put('/:id/stock', protect, admin, updateStock);

// Stock Request routes
router.get('/stock-requests', protect, admin, getStockRequests);
router.post('/stock-requests', protect, admin, createStockRequest);
router.get('/stock-requests/:id', protect, admin, getStockRequestById);
router.put('/stock-requests/:id/status', protect, admin, updateStockRequestStatus);
router.put('/stock-requests/:id/receive', protect, admin, receiveStock);

module.exports = router;
