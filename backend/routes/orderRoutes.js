const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderItems,
  getOrderInvoice,
  getDeliveryOrders,
  updateDeliveryStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
// Keep both routes for compatibility (frontend uses /myorders)
router.get('/myorders', protect, getMyOrders);
router.get('/orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/:id/invoice', protect, getOrderInvoice);

// Delivery Person Routes
router.get('/delivery/myorders', protect, getDeliveryOrders);
router.put('/:id/delivery-status', protect, updateDeliveryStatus);

router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/return', protect, requestReturn);
router.put('/:id/items', protect, updateOrderItems);

module.exports = router;
