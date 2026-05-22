const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['addition', 'deduction', 'adjustment', 'reorder'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reference: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    default: 1000
  },
  reorderPoint: {
    type: Number,
    default: 20
  },
  reorderQuantity: {
    type: Number,
    default: 50
  },
  lastRestocked: {
    type: Date
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  location: {
    warehouse: String,
    shelf: String,
    bin: String
  },
  isLowStock: {
    type: Boolean,
    default: false
  },
  autoReorder: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Update available stock and low stock flag before saving
inventorySchema.pre('save', function(next) {
  this.availableStock = this.currentStock - this.reservedStock;
  this.isLowStock = this.currentStock <= this.minStockLevel;
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

module.exports = { Inventory, InventoryLog };
