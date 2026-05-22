const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, 
            role, businessName, productCategory, nicNumber, photo } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    const userExists = await User.findOne({ email: new RegExp('^' + normalizedEmail + '$', 'i') });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const isSupplier = role === 'supplier';
    const isDelivery = role === 'delivery';

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      address,
      role: isSupplier ? 'supplier' : (isDelivery ? 'delivery' : 'customer'),
      businessName: isSupplier ? businessName : undefined,
      productCategory: isSupplier ? productCategory : undefined,
      nicNumber: isDelivery ? nicNumber : undefined,
      photo: isDelivery ? photo : undefined,
      isApproved: !(isSupplier || isDelivery)
    });

    if (isSupplier || isDelivery) {
      return res.status(201).json({ 
        message: 'Registration successful. Awaiting admin approval.' 
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    
    console.log('Login attempt for:', normalizedEmail);
    
    const user = await User.findOne({ email: new RegExp('^' + normalizedEmail + '$', 'i') });
    
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User found:', { role: user.role, isApproved: user.isApproved });
    
    const isPasswordValid = await user.matchPassword(password);
    
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if ((user.role === 'supplier' || user.role === 'delivery') && !user.isApproved) {
      console.log('User not approved:', normalizedEmail);
      return res.status(403).json({ 
        message: 'Account pending admin approval' 
      });
    }

    console.log('Login successful for:', normalizedEmail);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/auth/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject user account (Admin)
// @route   PUT /api/auth/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = isApproved;
    await user.save();

    res.json({ message: `User account ${isApproved ? 'approved' : 'rejected'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, getUsers, updateUserStatus };
