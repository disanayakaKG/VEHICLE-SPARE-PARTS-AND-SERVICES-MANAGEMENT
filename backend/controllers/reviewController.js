const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// Create review
const createReview = async (req, res) => {
  /* 
    BACKEND VALIDATION - CREATE REVIEW
     Rating: 1-5 stars (Mandatory via Mongoose)
     Title: 3-100 characters (Mandatory via Mongoose)
     Comment: 10-2000 characters (Mandatory via Mongoose)
     Eligibility: Must be a verified purchaser/completed booking.
     Uniqueness: One review per user/item.
  */
  try {
    const { product, service, rating, title, comment } = req.body;

    if (!product && !service) {
      return res.status(400).json({ message: 'Product or service is required' });
    }
    if (product && service) {
      return res.status(400).json({ message: 'Review can only be for a product or a service (not both)' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user._id,
      ...(product && { product }),
      ...(service && { service })
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this item' });
    }

    // Check if verified purchase (Direct check for any delivered order)
    let isVerifiedPurchase = false;
    let orderId = null;
    let bookingId = null;

    if (product) {
      const orderDoc = await Order.findOne({
        user: req.user._id,
        'items.product': product,
        orderStatus: 'delivered'
      });
      isVerifiedPurchase = !!orderDoc;
      if (orderDoc) orderId = orderDoc._id;
    }

    if (service) {
      const bookingDoc = await Booking.findOne({
        user: req.user._id,
        service,
        status: 'completed'
      });
      isVerifiedPurchase = !!bookingDoc;
      if (bookingDoc) bookingId = bookingDoc._id;
    }

    // Enforce: only delivered purchases / completed bookings can review
    if (product && !isVerifiedPurchase) {
      return res.status(400).json({ message: 'You can review this product only after purchasing and delivery' });
    }
    if (service && !isVerifiedPurchase) {
      return res.status(400).json({ message: 'You can leave service feedback only after completing the booking' });
    }

    const review = new Review({
      user: req.user._id,
      product,
      service,
      order: orderId,
      booking: bookingId,
      rating,
      title,
      comment,
      isVerifiedPurchase
    });

    const createdReview = await review.save();

    // Update product rating
    if (product) {
      const reviews = await Review.find({ product, isApproved: true });
      const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) || 0;
      await Product.findByIdAndUpdate(product, {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        isTopRated: avgRating >= 4
      });
    }
    // Update service rating
    if (service) {
      const reviews = await Review.find({ service, isApproved: true });
      const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) || 0;
      await Service.findByIdAndUpdate(service, {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        isTopRated: avgRating >= 4
      });
    }

    res.status(201).json(createdReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Check if user is eligible to review

const checkReviewEligibility = async (req, res) => {
  try {
    const { type } = req.query; // 'product' or 'service'
    const id = req.params.id;

    if (type === 'product') {
      const order = await Order.findOne({
        user: req.user._id,
        'items.product': id,
        orderStatus: 'delivered'
      });

      const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product: id
      });

      return res.json({
        eligible: !!order && !alreadyReviewed,
        purchased: !!order,
        alreadyReviewed: !!alreadyReviewed,
        message: !order ? 'You must purchase this product to leave a review' : (alreadyReviewed ? 'You have already reviewed this product' : '')
      });
    } else if (type === 'service') {
      const booking = await Booking.findOne({
        user: req.user._id,
        service: id,
        status: 'completed'
      });

      const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        service: id
      });

      return res.json({
        eligible: !!booking && !alreadyReviewed,
        purchased: !!booking,
        alreadyReviewed: !!alreadyReviewed,
        message: !booking ? 'You must complete a booking to leave a review' : (alreadyReviewed ? 'You have already reviewed this service' : '')
      });
    }

    res.status(400).json({ message: 'Invalid type' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { sortBy, page = 1, limit = 10 } = req.query;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating_high') sortOption = { rating: -1 };
    if (sortBy === 'rating_low') sortOption = { rating: 1 };
    if (sortBy === 'helpful') sortOption = { helpfulCount: -1 };

    const total = await Review.countDocuments({ product: req.params.productId, isApproved: true });
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const ratingDist = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      ratingDistribution: ratingDist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get service reviews
const getServiceReviews = async (req, res) => {
  try {
    const { sortBy, page = 1, limit = 10 } = req.query;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating_high') sortOption = { rating: -1 };
    if (sortBy === 'rating_low') sortOption = { rating: 1 };
    if (sortBy === 'helpful') sortOption = { helpfulCount: -1 };

    const total = await Review.countDocuments({ service: req.params.serviceId, isApproved: true });
    const reviews = await Review.find({ service: req.params.serviceId, isApproved: true })
      .populate('user', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reviews (Admin)
const getAllReviews = async (req, res) => {
  try {
    const { isApproved, page = 1, limit = 20 } = req.query;

    let query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject review (Admin)

const moderateReview = async (req, res) => {
  try {
    const { isApproved, adminResponse } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isApproved = isApproved;
    if (adminResponse) {
      review.adminResponse = {
        comment: adminResponse,
        respondedAt: new Date()
      };
    }

    const updatedReview = await review.save();

    // Update product rating if approved
    if (review.product && isApproved) {
      const reviews = await Review.find({ product: review.product, isApproved: true });
      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
      await Product.findByIdAndUpdate(review.product, {
        averageRating: avgRating.toFixed(1),
        totalReviews: reviews.length,
        isTopRated: avgRating >= 4
      });
    }
    // Update service rating if moderated
    if (review.service) {
      const reviews = await Review.find({ service: review.service, isApproved: true });
      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
      await Service.findByIdAndUpdate(review.service, {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        isTopRated: avgRating >= 4
      });
    }

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update review by ID
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.comment = req.body.comment || review.comment;
    review.isApproved = false; // Needs re-approval after edit

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete review using ID
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await review.deleteOne();
    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  checkReviewEligibility,
  getProductReviews,
  getServiceReviews,
  getAllReviews,
  moderateReview,
  updateReview,
  deleteReview,
  markHelpful
};
