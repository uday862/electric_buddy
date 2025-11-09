import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT Token
const generateToken = (userId, role, username) => {
  return jwt.sign(
    { userId, role, username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @desc    Register new admin (Admin only registration)
// @route   POST /api/auth/register
// @access  Public (but only allows admin registration)
export const register = async (req, res) => {
  try {
    const { name, username, password, mobile, role, secretCode, area, address } = req.body;

    // Only allow admin registration through this endpoint
    // Customers must be created by admins through the admin panel
    if (!secretCode) {
      return res.status(403).json({
        success: false,
        message: 'Admin secret code is required. Customer accounts can only be created by administrators.'
      });
    }

    // Validate secret code
    if (secretCode !== 'CODE123') {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin secret code. Only administrators can register through this endpoint.'
      });
    }

    // Force admin role - customers cannot register themselves
    const userRole = 'admin';

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Create admin user
    const user = new User({
      name,
      username: username.toLowerCase(),
      password,
      mobile,
      role: userRole,
      area: area || 'Not specified',
      address: address || 'Not specified',
      workStatus: 'pending'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role, user.username);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user (case insensitive)
    const user = await User.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.username);

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data'
    });
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON(),
      valid: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'mobile', 'area', 'address'];
    const updates = {};
    
    // Only allow certain fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};