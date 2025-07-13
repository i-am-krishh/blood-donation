const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }
    
    // Find user by id
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found'
      });
    }

    // Check if user is approved (except for admins)
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check'
    });
  }
};

// Middleware to check if user is camp organizer
const isCampOrganizer = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'camp_organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Camp organizer privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Camp Organizer Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check'
    });
  }
};

module.exports = { auth, isAdmin, isCampOrganizer }; 