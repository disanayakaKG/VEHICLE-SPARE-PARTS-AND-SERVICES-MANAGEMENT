const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getMyBookings, 
  getBookingById, 
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  getAvailableSlots
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
// Keep both routes for compatibility (frontend uses /mybookings)
router.get('/mybookings', protect, getMyBookings);
router.get('/bookings', protect, getMyBookings);
router.get('/slots/:serviceId/:date', getAvailableSlots);
router.get('/', protect, admin, getAllBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, admin, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
