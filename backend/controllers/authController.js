const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name, bloodType, location, phoneNumber, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    user = new User({
      email,
      password,
      name,
      bloodType,
      location,
      phoneNumber,
      role: role || 'donor', // Default to donor if no role specified
      isApproved: role === 'donor' // Auto-approve donors, others need admin approval
    });

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        user: user.toAuthJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is approved (except for admins)
    if (user.role !== 'admin' && !user.isApproved) {
      console.log('Unapproved user attempt:', email);
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    console.log('Successful login for user:', email);

    // Return user data and token
    res.json({
      success: true,
      data: {
        user: user.toAuthJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toAuthJSON()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
}; 