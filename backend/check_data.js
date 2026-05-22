const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
require('dotenv').config();

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const deliveryUsers = await User.find({ role: 'delivery' });
  console.log('Delivery Users Count:', deliveryUsers.length);
  deliveryUsers.forEach(u => console.log(`- ${u.name} (${u._id}) role: ${u.role} isApproved: ${u.isApproved}`));

  const allOrders = await Order.find({});
  console.log('Total Orders:', allOrders.length);
  
  const assignedOrders = allOrders.filter(o => o.deliveryPerson);
  console.log('Assigned Orders:', assignedOrders.length);
  assignedOrders.forEach(o => console.log(`- Order ${o.orderNumber}: Assigned to ${o.deliveryPerson}`));

  process.exit();
}

checkData().catch(err => {
  console.error(err);
  process.exit(1);
});
