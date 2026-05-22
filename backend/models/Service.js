const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Maintenance', 'Repair', 'Inspection', 'Installation', 'Customization', 'Emergency'],
    required: true
  },
  vehicleTypes: [{
    type: String,
    enum: ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus', 'All']
  }],
  duration: {
    type: Number,
    required: true,
    description: 'Duration in minutes'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  vehiclePricing: [{
    vehicleType: {
      type: String,
      enum: ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus']
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  image: {
    type: String,
    default: ''
  },
  isPackage: {
    type: Boolean,
    default: false
  },
  packageType: {
    type: String,
    enum: ['standard', 'premium', 'special'],
    default: 'standard'
  },
  includedServices: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  maxBookingsPerDay: {
    type: Number,
    default: 10
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isTopRated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
