const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  productCategories: [{
    type: String,
    enum: ['Engine Parts', 'Brake System', 'Electrical', 'Suspension', 'Body Parts', 'Interior', 'Exterior', 'Transmission', 'Cooling System', 'Fuel System', 'Other']
  }],
  vehicleBrands: [{
    type: String
  }],
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net_15', 'net_30', 'net_60'],
    default: 'net_30'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoReorderEnabled: {
    type: Boolean,
    default: false
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  leadTimeDays: {
    type: Number,
    default: 7
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
