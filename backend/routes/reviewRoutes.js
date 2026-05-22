const express = require('express');
const router = express.Router();
const {
  createReview,
  checkReviewEligibility,
  getProductReviews,
  getServiceReviews,
  getAllReviews,
  moderateReview,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/eligibility/:id', protect, checkReviewEligibility);
router.get('/product/:productId', getProductReviews);
router.get('/service/:serviceId', getServiceReviews);
router.get('/', protect, admin, getAllReviews);
router.put('/:id', protect, updateReview);
router.put('/:id/moderate', protect, admin, moderateReview);
router.put('/:id/helpful', markHelpful);
router.delete('/:id', protect, deleteReview);

module.exports = router;
