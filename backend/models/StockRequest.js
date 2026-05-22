const mongoose = require('mongoose');

const stockRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: false
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  receivedQuantity: {
    type: Number,
    default: 0
  },
  unitCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'shipped', 'received', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  },
  supplierResponse: {
    type: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  orderedAt: {
    type: Date
  },
  receivedAt: {
    type: Date
  }
}, { timestamps: true });

// Generate request number before saving
stockRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('StockRequest').countDocuments();
    this.requestNumber = `SR-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('StockRequest', stockRequestSchema);
