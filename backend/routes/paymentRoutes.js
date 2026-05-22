const express = require('express');
const router  = express.Router();
const {
  generatePaymentHash,
  generateOrderPaymentHash,
  payhereNotify,
  confirmPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Generate hash for SERVICE BOOKING payment — requires login
router.post('/hash',        protect, generatePaymentHash);

// Generate hash for PRODUCT ORDER payment — requires login
router.post('/order-hash',  protect, generateOrderPaymentHash);

// Optimistic payment confirm from popup callback — requires login
router.post('/confirm',     protect, confirmPayment);

// PayHere webhook — PUBLIC (PayHere servers POST here, no browser token)
// Receives application/x-www-form-urlencoded (not JSON)
// IMPORTANT: In production, must be a publicly accessible URL
router.post('/notify',      payhereNotify);

module.exports = router;
