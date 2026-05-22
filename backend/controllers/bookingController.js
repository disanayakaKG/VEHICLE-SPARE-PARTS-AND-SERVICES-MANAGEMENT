const Booking = require('../models/Booking');
const Service = require('../models/Service');

const getPriceByVehicleType = (service, vehicleType) => {
  const specificPrice = service?.vehiclePricing?.find((row) => row.vehicleType === vehicleType)?.price;
  if (specificPrice !== undefined && specificPrice !== null) return specificPrice;
  return service.price;
};

// @desc    Create booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { service, vehicleInfo, requestedDate, requestedTime, scheduledDate, scheduledTime, notes } = req.body;

    // Backend Validation: Check if the referenced service actually exists in the database
    const serviceData = await Service.findById(service);
    if (!serviceData) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Customer makes a reservation request; slot is assigned during admin approval.
    const reqDate = requestedDate || scheduledDate;
    const reqTime = requestedTime || scheduledTime;
    
    // Backend Validation: Ensure a requested date is provided before saving
    if (!reqDate) {
      return res.status(400).json({ message: 'Requested date is required' });
    }

    const booking = new Booking({
      user: req.user._id,
      service,
      vehicleInfo,
      requestedDate: reqDate,
      requestedTime: reqTime,
      totalPrice: getPriceByVehicleType(serviceData, vehicleInfo?.type),
      notes
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/mybookings
const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('service', 'name category price duration')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('service');

    if (booking) {
      if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Admin)
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes, assignedTechnician, scheduledDate, scheduledTime } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If admin confirms, they must assign a time slot
    if (status === 'confirmed') {
      if (!scheduledDate || !scheduledTime) {
        return res.status(400).json({ message: 'Scheduled date and time are required to confirm a booking' });
      }

      const conflict = await Booking.countDocuments({
        _id: { $ne: booking._id },
        service: booking.service,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: { $in: ['confirmed', 'in_progress'] }
      });

      if (conflict > 0) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      booking.scheduledDate = scheduledDate;
      booking.scheduledTime = scheduledTime;
    }

    booking.status = status || booking.status;
    booking.adminNotes = adminNotes || booking.adminNotes;
    booking.assignedTechnician = assignedTechnician || booking.assignedTechnician;

    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason;

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
const getAllBookings = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'name category price')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available slots
// @route   GET /api/bookings/slots/:serviceId/:date
const getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    
    const bookedSlots = await Booking.find({
      service: serviceId,
      scheduledDate: new Date(date),
      status: { $in: ['confirmed', 'in_progress'] }
    }).select('scheduledTime');

    const bookedTimes = bookedSlots.map(b => b.scheduledTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createBooking, 
  getMyBookings, 
  getBookingById, 
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  getAvailableSlots
};
