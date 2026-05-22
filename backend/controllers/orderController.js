const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { Inventory, InventoryLog } = require('../models/Inventory');

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  let order = null;

  try {
    const { items, shippingAddress, paymentMethod, discountCode } = req.body;

    // Validate basic input
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items', orderId: null });
    }

    // First, create a preliminary order to generate OrderID
    order = new Order({
      user: req.user._id,
      items: [],
      shippingAddress: shippingAddress || { street: '', city: '', state: '', zipCode: '', phone: '' },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      subtotal: 0,
      discountAmount: 0,
      shippingCost: 0,
      totalAmount: 0,
      orderStatus: 'pending',
      notes: 'Processing order...'
    });

    // Save to generate orderNumber
    await order.save();
    const orderId = order.orderNumber;

    // Now validate products and build order items
    let subtotal = 0;
    const orderItems = [];
    const errors = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        errors.push(`Product ${item.product} not found`);
        continue;
      }

      // Check stock availability
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory && inventory.availableStock < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${inventory.availableStock}, Requested: ${item.quantity}`);
        continue;
      }

      const price = product.discountPrice || product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: price
      });
    }

    // If any critical errors, auto-cancel the order
    if (errors.length > 0) {
      order.orderStatus = 'cancelled';
      order.notes = `Order failed: ${errors.join('; ')}`;
      await order.save();

      return res.status(400).json({
        message: errors.join('; '),
        orderId: orderId,
        orderStatus: 'cancelled',
        autoCancelled: true
      });
    }

    // If no valid items after processing
    if (orderItems.length === 0) {
      order.orderStatus = 'cancelled';
      order.notes = 'Order failed: No valid items could be processed';
      await order.save();

      return res.status(400).json({
        message: 'No valid items could be processed',
        orderId: orderId,
        orderStatus: 'cancelled',
        autoCancelled: true
      });
    }

    // Calculate totals
    let discountAmount = 0;
    if (discountCode === 'SAVE10') discountAmount = subtotal * 0.1;
    if (discountCode === 'SAVE20') discountAmount = subtotal * 0.2;

    const shippingCost = subtotal > 5000 ? 0 : 300;
    const totalAmount = subtotal - discountAmount + shippingCost;

    // Update order with actual values
    order.items = orderItems;
    order.subtotal = subtotal;
    order.discountAmount = discountAmount;
    order.discountCode = discountCode;
    order.shippingCost = shippingCost;
    order.totalAmount = totalAmount;
    order.notes = '';
    order.orderStatus = 'pending';

    const createdOrder = await order.save();

    // Deduct stock from inventory and sync product stock quantity
    for (const item of orderItems) {
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory) {
        inventory.reservedStock += item.quantity;
        await inventory.save();

        // Product stockQuantity should reflect available stock (current - reserved)
        const availableStock = inventory.currentStock - inventory.reservedStock;
        await Product.findByIdAndUpdate(item.product, { stockQuantity: Math.max(0, availableStock) });
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    // If order was created but something failed, auto-cancel it
    if (order && order._id) {
      try {
        order.orderStatus = 'cancelled';
        order.notes = `Order failed due to error: ${error.message}`;
        await order.save();

        return res.status(500).json({
          message: error.message,
          orderId: order.orderNumber,
          orderStatus: 'cancelled',
          autoCancelled: true
        });
      } catch (cancelError) {
        return res.status(500).json({
          message: error.message,
          orderId: order.orderNumber || null,
          orderStatus: 'cancelled'
        });
      }
    }
    res.status(500).json({ message: error.message, orderId: null });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };

    if (status) query.orderStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .populate('deliveryPerson', 'name phone');

    if (order) {
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, deliveryPerson, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restriction: Admins cannot set SHIPPED or DELIVERED statuses
    if (req.user.role === 'admin' && ['shipped', 'delivered'].includes(orderStatus)) {
      return res.status(403).json({ 
        message: 'Only delivery personnel can update order to Shipped or Delivered status' 
      });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = orderStatus || order.orderStatus;
    order.trackingNumber = trackingNumber || order.trackingNumber;
    order.deliveryPerson = deliveryPerson || order.deliveryPerson;
    order.estimatedDelivery = estimatedDelivery || order.estimatedDelivery;

    // Automated Assignment Logic when status becomes 'confirmed'
    if (orderStatus === 'confirmed' && oldStatus !== 'confirmed') {
      const deliveryStaff = await User.find({ role: 'delivery', isApproved: true, isActive: true });
      
      if (deliveryStaff.length > 0) {
        // Find the staff member with the least active orders and oldest last assignment
        const staffWithLoads = await Promise.all(deliveryStaff.map(async (staff) => {
          const activeCount = await Order.countDocuments({ 
            deliveryPerson: staff._id, 
            orderStatus: { $in: ['confirmed', 'shipped'] } 
          });
          
          const lastOrder = await Order.findOne({ deliveryPerson: staff._id })
            .sort({ createdAt: -1 })
            .select('createdAt');
            
          const lastAssignedTime = lastOrder ? lastOrder.createdAt.getTime() : 0;
            
          return { staff, activeCount, lastAssignedTime };
        }));

        // Sort by load, followed by the oldest assignment time
        staffWithLoads.sort((a, b) => {
          if (a.activeCount !== b.activeCount) {
            return a.activeCount - b.activeCount;
          }
          return a.lastAssignedTime - b.lastAssignedTime;
        });
        
        order.deliveryPerson = staffWithLoads[0].staff._id;
      }
    }

    // Logic for deducting stock when order is shipped or delivered
    if ((orderStatus === 'shipped' || orderStatus === 'delivered') &&
      ['pending', 'confirmed', 'processing'].includes(oldStatus)) {

      for (const item of order.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          const previousStock = inventory.currentStock;

          // Deduct from current and reserved stock
          inventory.currentStock -= item.quantity;
          inventory.reservedStock -= item.quantity;
          await inventory.save();

          // Sync product model stock (current stock has decreased, available stock remains same or decreases)
          await Product.findByIdAndUpdate(item.product, { stockQuantity: inventory.currentStock - inventory.reservedStock });

          // Create inventory log
          const log = new InventoryLog({
            product: item.product,
            type: 'deduction',
            quantity: item.quantity,
            previousStock,
            newStock: inventory.currentStock,
            reason: `Order ${order.orderNumber} ${orderStatus}`,
            reference: order.orderNumber,
            performedBy: req.user._id
          });
          await log.save();
        }
      }
    }

    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'completed';
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = 'cancelled';
    order.notes = req.body.reason || 'Cancelled by user';

    // Release reserved stock on cancellation and sync product stock
    if (['pending', 'confirmed', 'processing'].includes(oldStatus)) {
      for (const item of order.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          inventory.reservedStock = Math.max(0, inventory.reservedStock - item.quantity);
          await inventory.save();

          // Sync product model stock (available stock increases)
          await Product.findByIdAndUpdate(item.product, { stockQuantity: inventory.currentStock - inventory.reservedStock });
        }
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request return
// @route   PUT /api/orders/:id/return
const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Can only return delivered orders' });
    }

    order.returnStatus = 'requested';
    order.returnReason = req.body.reason;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.orderStatus = status;
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order items
// @route   PUT /api/orders/:id/items
const updateOrderItems = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Can only modify pending orders' });
    }

    const { items } = req.body;
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const price = product.discountPrice || product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: price
      });
    }

    order.items = orderItems;
    order.subtotal = subtotal;
    order.totalAmount = subtotal - order.discountAmount + order.shippingCost;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order invoice PDF
// @route   GET /api/orders/:id/invoice
const getOrderInvoice = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { generateOrderInvoice } = require('../utils/invoiceGenerator');

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate invoice content
    generateOrderInvoice(doc, { order, user: order.user });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Invoice Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders assigned to delivery person
// @route   GET /api/orders/delivery/myorders
const getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPerson: req.user._id })
      .populate('user', 'name address phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update delivery status by delivery person
// @route   PUT /api/orders/:id/delivery-status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryPerson?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized - This order is not assigned to you' });
    }

    if (!['shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update for delivery person' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;

    // Handle inventory logic if status moves to shipped or delivered
    if (['shipped', 'delivered'].includes(status) && ['pending', 'confirmed', 'processing'].includes(oldStatus)) {
      for (const item of order.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          inventory.currentStock -= item.quantity;
          inventory.reservedStock -= item.quantity;
          await inventory.save();
          await Product.findByIdAndUpdate(item.product, { 
            stockQuantity: inventory.currentStock - inventory.reservedStock 
          });
        }
      }
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'completed';
    }

    await order.save();
    res.json({ message: `Order marked as ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderItems,
  getOrderInvoice,
  getDeliveryOrders,
  updateDeliveryStatus
};
