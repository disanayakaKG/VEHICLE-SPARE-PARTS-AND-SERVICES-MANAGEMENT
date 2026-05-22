const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Since we are in backend/, we can use relative paths for models
const Order = require('./models/Order');
const Warranty = require('./models/Warranty');
const Product = require('./models/Product');

async function verify() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGODB_URI not found in .env');
      console.log('Available env keys:', Object.keys(process.env));
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Test 1: Order Search
    const searchStr = 'ORD'; // Common prefix
    const orders = await Order.find({ orderNumber: { $regex: searchStr, $options: 'i' } }).limit(5);
    console.log(`Found ${orders.length} orders matching "${searchStr}"`);
    if (orders.length > 0) {
      console.log('Sample Order Number:', orders[0].orderNumber);
    } else {
        // Try searching for something else if no ORD orders
        const anyOrder = await Order.findOne();
        if (anyOrder) {
            console.log('Found an order:', anyOrder.orderNumber);
            const partial = anyOrder.orderNumber.substring(0, 5);
            const filtered = await Order.find({ orderNumber: { $regex: partial, $options: 'i' } });
            console.log(`Searching for "${partial}" found ${filtered.length} orders.`);
        }
    }

    // Test 2: Warranty Calculation Logic
    const order = await Order.findOne({ orderStatus: 'delivered' }).populate('items.product');
    if (order) {
      console.log(`Testing warranty for Order: ${order.orderNumber}`);
      const warrantyStartDate = order.deliveredAt || order.createdAt;
      
      for (const item of order.items) {
        const product = item.product;
        if (!product) {
          console.log(`- Product for item ${item.name} not found or not populated.`);
          continue;
        }
        
        const warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (product.warrantyPeriod || 0));

        const isUnderWarranty = new Date() <= warrantyEndDate;
        console.log(`- Product: ${product.name}`);
        console.log(`  Warranty Period: ${product.warrantyPeriod} months`);
        console.log(`  Start: ${warrantyStartDate.toLocaleDateString()}`);
        console.log(`  End: ${warrantyEndDate.toLocaleDateString()}`);
        console.log(`  Is Under Warranty: ${isUnderWarranty}`);
      }
    } else {
      console.log('No delivered orders found for warranty test.');
      const anyOrder = await Order.findOne().populate('items.product');
      if (anyOrder) {
          console.log(`Testing logic with non-delivered order: ${anyOrder.orderNumber}`);
          const warrantyStartDate = anyOrder.createdAt;
          for (const item of anyOrder.items) {
              const product = item.product;
              if (!product) continue;
              const warrantyEndDate = new Date(warrantyStartDate);
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (product.warrantyPeriod || 0));
              const isUnderWarranty = new Date() <= warrantyEndDate;
              console.log(`- Product: ${product.name}, Under Warranty: ${isUnderWarranty}`);
          }
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
