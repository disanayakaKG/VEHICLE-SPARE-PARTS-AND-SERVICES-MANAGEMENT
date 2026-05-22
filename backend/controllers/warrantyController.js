const Warranty = require('../models/Warranty');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');
const { generateWarrantyInvoice } = require('../utils/invoiceGenerator');

// Create warranty claim
const createWarrantyClaim = async (req, res) => {
  try {
    const { product, order, issueDescription, issueType } = req.body;
    const images = Array.isArray(req.files)
      ? req.files.map((f) => `/uploads/warranty/${f.filename}`)
      : [];

    // Verify order and product
    const orderDoc = await Order.findOne({
      _id: order,
      user: req.user._id,
      'items.product': product,
      orderStatus: 'delivered'
    });

    if (!orderDoc) {
      return res.status(400).json({ message: 'Invalid order or product' });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check warranty period
    const warrantyStartDate = orderDoc.deliveredAt || orderDoc.createdAt;
    const warrantyEndDate = new Date(warrantyStartDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (productDoc.warrantyPeriod || 0));

    if (new Date() > warrantyEndDate) {
      return res.status(400).json({ message: 'Warranty period has expired' });
    }

    const warranty = new Warranty({
      user: req.user._id,
      product,
      order,
      warrantyStartDate,
      warrantyEndDate,
      issueDescription,
      issueType,
      images
    });

    const createdClaim = await warranty.save();
    res.status(201).json(createdClaim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my warranty claims
const getMyClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Warranty.countDocuments(query);
    const claims = await Warranty.find(query)
      .populate('product', 'name images')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      claims,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get warranty claim by ID
const getClaimById = async (req, res) => {
  try {
    const claim = await Warranty.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('product', 'name images partNumber')
      .populate('order', 'orderNumber');

    if (claim) {
      if (claim.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      res.json(claim);
    } else {
      res.status(404).json({ message: 'Warranty claim not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get all warranty claims (Admin)
const getAllClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const total = await Warranty.countDocuments(query);
    const claims = await Warranty.find(query)
      .populate('user', 'name email')
      .populate('product', 'name partNumber')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      claims,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//   Update warranty claim status (Admin)
const updateClaimStatus = async (req, res) => {
  try {
    const { status, resolution, adminNotes, replacementProduct, replacementTrackingNumber, replacementNotes } = req.body;
    
    const claim = await Warranty.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    claim.status = status || claim.status;
    claim.resolution = resolution || claim.resolution;
    claim.adminNotes = adminNotes || claim.adminNotes;
    claim.replacementProduct = replacementProduct || claim.replacementProduct;
    claim.replacementTrackingNumber = replacementTrackingNumber || claim.replacementTrackingNumber;

    // Add to replacement history when a replacement is sent
    if (resolution === 'replacement' && replacementTrackingNumber) {
      claim.replacementHistory.push({
        replacementProduct: replacementProduct || claim.replacementProduct,
        trackingNumber: replacementTrackingNumber,
        shippedAt: new Date(),
        notes: replacementNotes || adminNotes,
        status: 'shipped'
      });
    }

    if (status === 'completed') {
      claim.resolvedAt = new Date();
    }

    const updatedClaim = await claim.save();
    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Check warranty status for a product
const checkWarrantyStatus = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const warrantyStartDate = order.deliveredAt || order.createdAt;
    const warrantyEndDate = new Date(warrantyStartDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (product.warrantyPeriod || 0));

    const isUnderWarranty = new Date() <= warrantyEndDate;

    res.json({
      productName: product.name,
      warrantyPeriod: product.warrantyPeriod,
      warrantyStartDate,
      warrantyEndDate,
      isUnderWarranty,
      daysRemaining: isUnderWarranty ? Math.ceil((warrantyEndDate - new Date()) / (1000 * 60 * 60 * 24)) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Add replacement to history (Admin)
const addReplacementHistory = async (req, res) => {
  try {
    const { replacementProduct, trackingNumber, notes } = req.body;
    
    const claim = await Warranty.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    if (!trackingNumber) {
      return res.status(400).json({ message: 'Tracking number is required' });
    }

    // Add to replacement history
    claim.replacementHistory.push({
      replacementProduct: replacementProduct || claim.replacementProduct,
      trackingNumber,
      shippedAt: new Date(),
      notes,
      status: 'shipped'
    });

    // Update main replacement tracking
    claim.replacementTrackingNumber = trackingNumber;
    if (replacementProduct) {
      claim.replacementProduct = replacementProduct;
    }
    claim.status = 'replacement_sent';

    const updatedClaim = await claim.save();
    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download warranty invoice PDF
const downloadWarrantyInvoice = async (req, res) => {
  try {
    const claim = await Warranty.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('product', 'name partNumber images')
      .populate('order', 'orderNumber totalAmount createdAt shippingAddress paymentMethod')
      .populate('replacementHistory.replacementProduct', 'name partNumber');

    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    // Check authorization
    if (claim.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="warranty-invoice-${claim.claimNumber}.pdf"`);

    // Pipe to response
    doc.pipe(res);

    // Generate invoice content
    generateWarrantyInvoice(doc, {
      claim: {
        claimNumber: claim.claimNumber,
        issueType: claim.issueType,
        issueDescription: claim.issueDescription,
        status: claim.status,
        resolution: claim.resolution,
        warrantyStartDate: claim.warrantyStartDate,
        warrantyEndDate: claim.warrantyEndDate,
        createdAt: claim.createdAt,
        resolvedAt: claim.resolvedAt,
        adminNotes: claim.adminNotes,
        replacementTrackingNumber: claim.replacementTrackingNumber,
        replacementHistory: claim.replacementHistory
      },
      product: {
        name: claim.product?.name,
        partNumber: claim.product?.partNumber,
        images: claim.product?.images
      },
      order: {
        orderNumber: claim.order?.orderNumber,
        totalAmount: claim.order?.totalAmount,
        createdAt: claim.order?.createdAt,
        shippingAddress: claim.order?.shippingAddress,
        paymentMethod: claim.order?.paymentMethod
      },
      user: {
        name: claim.user?.name,
        email: claim.user?.email,
        phone: claim.user?.phone
      }
    });

    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download warranty card PDF (after approval)
const downloadWarrantyCard = async (req, res) => {
  try {
    const claim = await Warranty.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('product', 'name partNumber')
      .populate('order', 'orderNumber createdAt');

    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    // Check authorization
    if (claim.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['approved', 'replacement_sent', 'completed'].includes(claim.status)) {
      return res.status(400).json({ message: 'Warranty card is available after approval' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="warranty-card-${claim.claimNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).text('Warranty Card', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text('AutoPartsPro', { align: 'center' });
    doc.moveDown(1.5);
    doc.fillColor('#000');

    // Card details
    const leftX = doc.page.margins.left;
    const label = (t) => doc.fontSize(10).fillColor('#666').text(t, leftX);
    const value = (t) => doc.fontSize(12).fillColor('#000').text(t || '-', leftX);

    label('Claim Number'); value(claim.claimNumber);
    doc.moveDown(0.5);
    label('Customer'); value(claim.user?.name);
    label('Email'); value(claim.user?.email);
    if (claim.user?.phone) { label('Phone'); value(claim.user.phone); }
    doc.moveDown(0.5);
    label('Order Number'); value(claim.order?.orderNumber);
    label('Product'); value(claim.product?.name);
    label('Part Number'); value(claim.product?.partNumber);
    doc.moveDown(0.5);
    label('Warranty Start'); value(new Date(claim.warrantyStartDate).toLocaleDateString());
    label('Warranty End'); value(new Date(claim.warrantyEndDate).toLocaleDateString());
    doc.moveDown(0.5);
    label('Status'); value(claim.status.replace('_', ' '));
    if (claim.resolution) { label('Resolution'); value(claim.resolution); }

    doc.moveDown(1.5);
    doc.fontSize(9).fillColor('#666').text(
      'This warranty card is generated after claim approval. Keep it for your records. ' +
      'All warranty terms and conditions apply.',
      { align: 'left' }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get warranty status for all items in an order (Admin)
const getOrderWarranties = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const warrantyStartDate = order.deliveredAt || order.createdAt;
    
    const warranties = await Promise.all(order.items.map(async (item) => {
      const product = item.product;
      const warrantyEndDate = new Date(warrantyStartDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (product.warrantyPeriod || 0));

      const isUnderWarranty = new Date() <= warrantyEndDate;

      return {
        productId: product._id,
        productName: product.name,
        warrantyPeriod: product.warrantyPeriod,
        warrantyStartDate,
        warrantyEndDate,
        isUnderWarranty,
        daysRemaining: isUnderWarranty ? Math.ceil((warrantyEndDate - new Date()) / (1000 * 60 * 60 * 24)) : 0
      };
    }));

    res.json(warranties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createWarrantyClaim, 
  getMyClaims, 
  getClaimById,
  getAllClaims,
  updateClaimStatus,
  checkWarrantyStatus,
  addReplacementHistory,
  downloadWarrantyInvoice,
  downloadWarrantyCard,
  getOrderWarranties
};
