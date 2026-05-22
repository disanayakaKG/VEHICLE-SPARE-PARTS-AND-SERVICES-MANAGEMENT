const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const ADMIN_EMAIL = 'admin@autoparts.com';
const ADMIN_PASSWORD = 'admin123';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const resetPassword = process.argv.includes('--reset');

    let admin = await User.findOne({ email: ADMIN_EMAIL });

    if (admin) {
      if (resetPassword) {
        admin.password = ADMIN_PASSWORD;
        await admin.save();
        console.log('Admin password reset successfully.');
      } else {
        console.log('Admin user already exists.');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('If login fails, your password hash may be corrupted. Run: node seedAdmin.js --reset');
      }
      process.exit(0);
    }

    await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone: '+94 77 123 4567',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('================================');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('================================');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
