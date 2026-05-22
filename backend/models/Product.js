const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true
    },
    itemId: {
      type: String,
      required: [true, 'OEM code is required'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      minlength: [2, 'Product name must be at least 2 characters'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Car', 'Van', 'Bike', 'SUV', 'Lorry', 'Bus', 'Pickup', 'Three Wheeler', 'Tractor', 'Electric Vehicle']
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    vehicleBrand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    warrantyPeriod: {
      type: Number,
      default: 0,
      min: [0, 'Warranty period cannot be negative']
    },
    stockQuantity: {
      type: Number,
      min: [0, 'Stock quantity cannot be negative'],
      default: null
    },
    yearFrom: {
      type: Number,
      min: [1900, 'Year From must be at least 1900'],
      default: null
    },
    yearTo: {
      type: Number,
      min: [1900, 'Year To must be at least 1900'],
      default: null
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    removedAt: {
      type: Date,
      default: null
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    alternativeNames: {
      type: [String],
      default: [],
      trim: true
    },
    baseProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    }
  },
  { timestamps: true }
);

// Pre-validate middleware to generate productId if not provided
productSchema.pre('validate', function (next) {
  if (!this.productId) {
    const idString = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
    const last6Chars = idString.slice(-6).toUpperCase();
    this.productId = `PRD-${last6Chars}`;
  }
  next();
});

// Pre-save middleware to calculate finalPrice using percentage discount
productSchema.pre('save', function (next) {
  const discountPercent = this.discount || 0;
  this.finalPrice = this.price - (this.price * discountPercent / 100);
  next();
});

// Virtual field to expose finalPrice as discountPrice for frontend compatibility
productSchema.virtual('discountPrice').get(function() {
  return this.finalPrice;
});

// Enable virtual fields in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for search functionality
productSchema.index({
  productId: 1,
  itemId: 1,
  name: 'text',
  description: 'text',
  brand: 'text',
  vehicleBrand: 'text',
  vehicleModel: 'text',
  alternativeNames: 'text'
});

module.exports = mongoose.model('Product', productSchema);