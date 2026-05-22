const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const StockRequest = require('../models/StockRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all suppliers
// @route   GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const { category, search, sortBy, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };

    if (category) query.productCategories = category;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'contactPerson.name': new RegExp(search, 'i') }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating') sortOption = { rating: -1 };
    if (sortBy === 'name') sortOption = { name: 1 };

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create supplier (Admin)
// @route   POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const createdSupplier = await supplier.save();
    res.status(201).json(createdSupplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update supplier (Admin)
// @route   PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const id = req.params.id;
    // 1. Try to update in Supplier collection
    let supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
    
    // 2. Try to update in User collection (since the ID might be a User ID)
    let user = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      businessName: req.body.name, // Usually maps to businessName
    }, { new: true });

    if (supplier || user) {
      res.json(supplier || user);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete supplier (Admin)
// @route   DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const id = req.params.id;
    // 1. Try to find and deactivate in Supplier collection
    const supplier = await Supplier.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    // 2. Try to find and deactivate in User collection (since the ID might be a User ID)
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (supplier || user) {
      res.json({ message: 'Supplier deactivated' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suppliers by product category
// @route   GET /api/suppliers/by-category/:category
const getSuppliersByCategory = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ 
      isActive: true, 
      productCategories: req.params.category 
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- ADMIN: Supplier account management ----

const getPendingSuppliers = async (req, res) => {
  try {
    const suppliers = await User.find({ 
      role: 'supplier', 
      isApproved: false,
      isActive: true
    }).select('-password');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApprovedSuppliers = async (req, res) => {
  try {
    const suppliers = await User.find({ 
      role: 'supplier', 
      isApproved: true,
      isActive: true
    }).select('-password');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveSupplier = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'Supplier not found' });

    // Sync: Create/Update a Supplier record for this user
    let supplierRecord = await Supplier.findOne({ email: user.email });
    
    if (!supplierRecord) {
      supplierRecord = new Supplier({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        productCategories: user.productCategory ? [user.productCategory] : [],
        isActive: true
      });
      await supplierRecord.save();
    } else {
      supplierRecord.isActive = true;
      await supplierRecord.save();
    }

    res.json({ message: 'Supplier approved', user, supplier: supplierRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- SUPPLIER DASHBOARD: Products ----

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.user._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMyProduct = async (req, res) => {
  try {
    const product = new Product({ 
      ...req.body, 
      supplier: req.user._id 
    });
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, supplier: req.user._id },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ 
      message: 'Product not found' 
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMyProduct = async (req, res) => {
  try {
    await Product.findOneAndDelete({ 
      _id: req.params.id, 
      supplier: req.user._id 
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- SUPPLIER DASHBOARD: Orders ----

const getMyOrders = async (req, res) => {
  try {
    const products = await Product.find({ 
      supplier: req.user._id 
    }).select('_id');
    const productIds = products.map(p => p._id);
    const orders = await Order.find({ 
      'orderItems.product': { $in: productIds } 
    })
      .populate('orderItems.product', 'name price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const dispatchOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'shipped' },
      { new: true }
    );
    if (!order) return res.status(404).json({ 
      message: 'Order not found' 
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- SUPPLIER DASHBOARD: Stock Alerts ----

const getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find({
      supplier: req.user._id,
      countInStock: { $lt: 5 }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendRestockRequest = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ 
      message: 'Product not found' 
    });
    const request = new StockRequest({
      product: productId,
      supplier: req.user._id,
      requestedQuantity: quantity,
      notes: note,
      requestedBy: req.user._id
    });
    await request.save();
    res.status(201).json({ 
      message: 'Restock request sent', 
      request 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- SUPPLIER DASHBOARD: Stock Requests ----

const getMyStockRequests = async (req, res) => {
  try {
    const stockRequests = await StockRequest.find({ 
      supplier: req.user._id 
    })
      .populate('product', 'name partNumber')
      .populate('requestedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(stockRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyStockRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Find the stock request and ensure it belongs to the logged-in supplier
    const request = await StockRequest.findOne({ 
      _id: id, 
      supplier: req.user._id 
    }).populate('product');

    if (!request) {
      return res.status(404).json({ message: 'Stock request not found' });
    }

    // Validate status transitions (use enum values from model)
    const validTransitions = {
      'pending': ['approved', 'cancelled'],
      'approved': ['ordered']
    };

    if (!validTransitions[request.status] || !validTransitions[request.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${request.status} to ${status}` 
      });
    }

    // On dispatch transition (ordered status), reduce supplier stock once
    const dispatchFinalStates = ['ordered', 'shipped', 'received'];
    const alreadyDispatched = dispatchFinalStates.includes(request.status);

    if (status === 'ordered' && !alreadyDispatched) {
      if (!request.product) {
        return res.status(404).json({ message: 'Product not found for this request' });
      }

      const requestProduct = request.product;

      let supplierProduct = await Product.findOne({
        supplier: req.user._id,
        _id: requestProduct._id
      });

      if (!supplierProduct && requestProduct.itemId) {
        supplierProduct = await Product.findOne({
          supplier: req.user._id,
          itemId: requestProduct.itemId
        });
      }

      if (!supplierProduct && requestProduct.productId) {
        supplierProduct = await Product.findOne({
          supplier: req.user._id,
          productId: requestProduct.productId
        });
      }

      if (!supplierProduct && requestProduct._id) {
        supplierProduct = await Product.findOne({
          supplier: req.user._id,
          baseProduct: requestProduct._id
        });
      }

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

    // Update the status
    request.status = status;
    request.updatedAt = new Date();

    await request.save();

    // Create notification for Admin when status becomes 'ordered' (Dispatch)
    if (status === 'ordered') {
      try {
        await Notification.create({
          message: `you request oder was received ${request.requestNumber}`,
          relatedId: request.requestNumber,
          type: 'inventory'
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the request update if notification fails
      }
    }

    res.json({ message: `Stock request ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- SUPPLIER DASHBOARD: Profile ----

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        businessName: req.body.businessName,
        productCategory: req.body.productCategory
      },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersByCategory,
  getPendingSuppliers,
  getApprovedSuppliers,
  approveSupplier,
  getMyProducts,
  addMyProduct,
  updateMyProduct,
  deleteMyProduct,
  getMyOrders,
  dispatchOrder,
  getLowStockAlerts,
  sendRestockRequest,
  getMyStockRequests,
  updateMyStockRequestStatus,
  getMyProfile,
  updateMyProfile
};
