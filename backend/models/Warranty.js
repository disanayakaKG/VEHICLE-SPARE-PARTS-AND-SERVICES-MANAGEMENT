const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  claimNumber: {
    type: String,
    unique: true
  },
  warrantyStartDate: {
    type: Date,
    required: true
  },
  warrantyEndDate: {
    type: Date,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  issueType: {
    type: String,
    enum: ['defective', 'damaged', 'not_working', 'wrong_item', 'other'],
    required: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'replacement_sent', 'completed'],
    default: 'pending'
  },
  resolution: {
    type: String,
    enum: ['replacement', 'repair', 'refund', 'rejected'],
  },
  adminNotes: {
    type: String
  },
  replacementProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  replacementTrackingNumber: {
    type: String
  },
  replacementHistory: [{
    replacementProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    trackingNumber: {
      type: String
    },
    shippedAt: {
      type: Date
    },
    receivedAt: {
      type: Date
    },
    notes: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'failed'],
      default: 'pending'
    }
  }],
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

// Generate claim number before saving
warrantySchema.pre('save', async function(next) {
  if (!this.claimNumber) {
    const count = await mongoose.model('Warranty').countDocuments();
    this.claimNumber = `WC-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Warranty', warrantySchema);
