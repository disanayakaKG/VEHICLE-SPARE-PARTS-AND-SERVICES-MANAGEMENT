const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  bookingNumber: {
    type: String,
    unique: true
  },
  vehicleInfo: {
    type: {
      type: String,
      // Server check: Only allows these specific vehicle words
      enum: ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus'],
      required: true // Server check: The user must select a vehicle type
    },
    brand: { type: String, required: true }, // Server check: Brand cannot be empty
    model: { type: String, required: true }, // Server check: Model cannot be empty
    year: { type: Number }, // Server check: If set, the year must be a number
    plateNumber: { type: String, required: true } // Server check: Plate number cannot be empty
  },
  // Customer requested date/time (request stage)
  requestedDate: {
    type: Date,
    required: true // Server check: A requested date is completely required
  },
  requestedTime: {
    type: String // Optional time slot
  },
  // Admin assigned slot (confirmation stage)
  scheduledDate: {
    type: Date
  },
  scheduledTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  assignedTechnician: {
    type: String
  },
  completedAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  // PayHere payment tracking fields
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid'
  },
  paymentId: {
    type: String // PayHere transaction/payment ID returned after successful payment
  },
  payhereOrderId: {
    type: String // Unique order ID we generate and send to PayHere
  }
}, { timestamps: true });

// Backward compatibility: if older docs only have scheduledDate
bookingSchema.pre('validate', function (next) {
  if (!this.requestedDate && this.scheduledDate) {
    this.requestedDate = this.scheduledDate;
  }
  if (!this.requestedTime && this.scheduledTime) {
    this.requestedTime = this.scheduledTime;
  }
  next();
});

// Generate booking number before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `BK-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
