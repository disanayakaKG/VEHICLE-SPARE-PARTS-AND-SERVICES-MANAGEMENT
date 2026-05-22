const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { 
  createWarrantyClaim, 
  getMyClaims, 
  getClaimById,
  getAllClaims,
  updateClaimStatus,
  checkWarrantyStatus,
  addReplacementHistory,
  downloadWarrantyInvoice,
  downloadWarrantyCard,
  getOrderWarranties
} = require('../controllers/warrantyController');
const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'warranty'));
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    cb(null, `warranty-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype) return cb(null, false);
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image uploads are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB per image
});

router.post('/', protect, upload.array('images', 5), createWarrantyClaim);
// Keep both routes for compatibility (frontend uses /myclaims)
router.get('/myclaims', protect, getMyClaims);
router.get('/claims', protect, getMyClaims);
router.get('/check/:orderId/:productId', protect, checkWarrantyStatus);
router.get('/', protect, admin, getAllClaims);
router.get('/:id', protect, getClaimById);
router.get('/:id/invoice', protect, downloadWarrantyInvoice);
router.get('/:id/card', protect, downloadWarrantyCard);
router.put('/:id/status', protect, admin, updateClaimStatus);
router.post('/:id/replacement', protect, admin, addReplacementHistory);
router.get('/order/:orderId', protect, admin, getOrderWarranties);

module.exports = router;
