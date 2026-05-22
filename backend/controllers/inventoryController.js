const { Inventory, InventoryLog } = require('../models/Inventory');
const Product = require('../models/Product');
const StockRequest = require('../models/StockRequest');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

// @desc    Get all inventory items
// @route   GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const { lowStock, search, page = 1, limit = 20 } = req.query;

    let query = {};
    if (lowStock === 'true') query.isLowStock = true;

    const total = await Inventory.countDocuments(query);
    let inventory = await Inventory.find(query)
      .populate('product', 'name partNumber category')
      .populate('supplier', 'name')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (search) {
      inventory = inventory.filter(inv =>
        inv.product.name.toLowerCase().includes(search.toLowerCase()) ||
        inv.product.partNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      inventory,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const alerts = await Inventory.find({ isLowStock: true })
      .populate('product', 'name partNumber category')
      .populate('supplier', 'name email');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory by product
// @route   GET /api/inventory/product/:productId
const getInventoryByProduct = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.productId })
      .populate('product')
      .populate('supplier', 'name');
    if (inventory) {
      res.json(inventory);
    } else {
      res.status(404).json({ message: 'Inventory not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update inventory
// @route   POST /api/inventory
const createInventory = async (req, res) => {
  try {
    const { product, currentStock, minStockLevel, maxStockLevel, reorderPoint, reorderQuantity, supplier, location, autoReorder } = req.body;

    let inventory = await Inventory.findOne({ product });

    if (inventory) {
      inventory.currentStock = currentStock;
      inventory.minStockLevel = minStockLevel || inventory.minStockLevel;
      inventory.maxStockLevel = maxStockLevel || inventory.maxStockLevel;
      inventory.reorderPoint = reorderPoint || inventory.reorderPoint;
      inventory.reorderQuantity = reorderQuantity || inventory.reorderQuantity;
      inventory.supplier = supplier || inventory.supplier;
      inventory.location = location || inventory.location;
      inventory.autoReorder = autoReorder !== undefined ? autoReorder : inventory.autoReorder;
    } else {
      inventory = new Inventory(req.body);
    }

    const savedInventory = await inventory.save();

    // Update product stock
    await Product.findByIdAndUpdate(product, { stockQuantity: currentStock });

    res.status(201).json(savedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock quantity
// @route   PUT /api/inventory/:id/stock
const updateStock = async (req, res) => {
  try {
    const { type, quantity, reason, reference } = req.body;

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const previousStock = inventory.currentStock;
    let newStock = previousStock;

    switch (type) {
      case 'addition':
        newStock = previousStock + quantity;
        inventory.lastRestocked = new Date();
        break;
      case 'deduction':
        newStock = Math.max(0, previousStock - quantity);
        break;
      case 'adjustment':
        newStock = quantity;
        break;
    }

    inventory.currentStock = newStock;
    await inventory.save();

    // Update product stock
    await Product.findByIdAndUpdate(inventory.product, { stockQuantity: newStock });

    // Create log entry
    const log = new InventoryLog({
      product: inventory.product,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      reference,
      performedBy: req.user._id
    });
    await log.save();

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory logs
// @route   GET /api/inventory/logs/:productId
const getInventoryLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.productId })
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory report
// @route   GET /api/inventory/report
const getInventoryReport = async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ isLowStock: true });
    const outOfStock = await Inventory.countDocuments({ currentStock: 0 });

    const totalValue = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$productInfo.price'] } }
        }
      }
    ]);

    res.json({
      totalItems,
      lowStockItems,
      outOfStock,
      totalValue: totalValue[0]?.totalValue || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
const deleteInventoryItem = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Keep product stock in sync when inventory row is removed.
    await Product.findByIdAndUpdate(inventory.product, { stockQuantity: 0 });
    await Inventory.findByIdAndDelete(req.params.id);

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Create stock request
// @route   POST /api/inventory/stock-requests
const createStockRequest = async (req, res) => {
  try {
    const { productId, supplierId, requestedQuantity, priority, notes, unitCost } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate supplier exists and is approved
    const supplier = await User.findById(supplierId);
    if (!supplier || supplier.role !== 'supplier' || !supplier.isApproved) {
      return res.status(404).json({ message: 'Approved supplier not found' });
    }

    const stockRequest = new StockRequest({
      product: productId,
      supplier: supplierId,
      requestedQuantity,
      priority: priority || 'normal',
      notes,
      unitCost: unitCost || 0,
      totalCost: (unitCost || 0) * requestedQuantity,
      requestedBy: req.user._id
    });

    const savedRequest = await stockRequest.save();

    // Populate for response
    await savedRequest.populate('product', 'name partNumber');
    await savedRequest.populate('supplier', 'name email businessName');
    await savedRequest.populate('requestedBy', 'name');

    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stock requests
// @route   GET /api/inventory/stock-requests
const getStockRequests = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const total = await StockRequest.countDocuments(query);
    const requests = await StockRequest.find(query)
      .populate('product', 'name partNumber category')
      .populate('supplier', 'name email phone')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock request by ID
// @route   GET /api/inventory/stock-requests/:id
const getStockRequestById = async (req, res) => {
  try {
    const request = await StockRequest.findById(req.params.id)
      .populate('product', 'name partNumber category price')
      .populate('supplier', 'name email phone contactPerson')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Stock request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock request status
// @route   PUT /api/inventory/stock-requests/:id/status
const updateStockRequestStatus = async (req, res) => {
  try {
    const { status, supplierResponse, expectedDeliveryDate, unitCost } = req.body;

    const request = await StockRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Stock request not found' });
    }

    const priorStatus = request.status;
    const isDispatchedStatus = ['ordered', 'dispatched'].includes(status);
    const wasDispatchedAlready = ['ordered', 'dispatched', 'shipped', 'received'].includes(priorStatus);

    request.status = status;

    if (status === 'approved') {
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    }

    if (status === 'ordered' || status === 'dispatched') {
      // Only set orderedAt on first dispatch transition
      if (!wasDispatchedAlready) {
        request.orderedAt = new Date();

        const supplierProduct = await Product.findOne({
          _id: request.product,
          supplier: request.supplier
        });

        if (!supplierProduct) {
          return res.status(404).json({ message: 'Supplier product not found for stock update' });
        }

        const currentStock = Number(supplierProduct.stockQuantity || 0);
        const requestedQty = Number(request.requestedQuantity || 0);

        if (currentStock < requestedQty) {
          return res.status(400).json({ message: 'Not enough supplier stock to dispatch this order' });
        }

        supplierProduct.stockQuantity = currentStock - requestedQty;
        await supplierProduct.save();
      }
    }

    if (status === 'cancelled') {
      request.notes = request.notes ? `${request.notes} | Cancelled` : 'Cancelled';
    }

    if (supplierResponse) request.supplierResponse = supplierResponse;
    if (expectedDeliveryDate) request.expectedDeliveryDate = expectedDeliveryDate;
    if (unitCost) {
      request.unitCost = unitCost;
      request.totalCost = unitCost * request.requestedQuantity;
    }

    const updatedRequest = await request.save();
    await updatedRequest.populate('product', 'name partNumber');
    await updatedRequest.populate('supplier', 'name');

    res.json(updatedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Receive stock from request
// @route   PUT /api/inventory/stock-requests/:id/receive
const receiveStock = async (req, res) => {
  try {
    const { receivedQuantity, notes } = req.body;

    const request = await StockRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Stock request not found' });
    }

    if (!['ordered', 'shipped'].includes(request.status)) {
      return res.status(400).json({ message: 'Can only receive stock for ordered or shipped requests' });
    }

    request.receivedQuantity = receivedQuantity;
    request.status = 'received';
    request.receivedAt = new Date();
    request.actualDeliveryDate = new Date();
    if (notes) request.notes = notes;

    await request.save();

    // Update inventory with received stock
    let inventory = await Inventory.findOne({ product: request.product });

    if (inventory) {
      const previousStock = inventory.currentStock;
      inventory.currentStock += receivedQuantity;
      inventory.lastRestocked = new Date();
      await inventory.save();

      // Update product stock
      await Product.findByIdAndUpdate(request.product, {
        stockQuantity: inventory.currentStock
      });

      // Create inventory log
      const log = new InventoryLog({
        product: request.product,
        type: 'addition',
        quantity: receivedQuantity,
        previousStock,
        newStock: inventory.currentStock,
        reason: `Stock received from request ${request.requestNumber}`,
        reference: request.requestNumber,
        performedBy: req.user._id
      });
      await log.save();
    } else {
      // Create new inventory record if none exists
      inventory = new Inventory({
        product: request.product,
        currentStock: receivedQuantity,
        supplier: request.supplier,
        lastRestocked: new Date()
      });
      await inventory.save();

      await Product.findByIdAndUpdate(request.product, {
        stockQuantity: receivedQuantity
      });
    }

    await request.populate('product', 'name partNumber');
    await request.populate('supplier', 'name');

    res.json({
      request,
      inventoryUpdated: true,
      newStock: inventory.currentStock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getInventory, 
  getLowStockAlerts,
  getInventoryByProduct,
  createInventory, 
  deleteInventoryItem,
  updateStock,
  getInventoryLogs,
  getInventoryReport,
  createStockRequest,
  getStockRequests,
  getStockRequestById,
  updateStockRequestStatus,
  receiveStock
};
