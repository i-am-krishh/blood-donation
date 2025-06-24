const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 1 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res) => {
    throw new AppError('Too many requests from this IP, please try again after 15 minutes', 429);
  }
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  max: 20, // Limit each IP to 5 requests per windowMs
  windowMs: 1 * 60 * 1000, // 15 minutes
  message: 'Too many login attempts, please try again after 15 minutes',
  handler: (req, res) => {
    throw new AppError('Too many login attempts, please try again after 15 minutes', 429);
  }
});

module.exports = {
  limiter,
  authLimiter
}; 