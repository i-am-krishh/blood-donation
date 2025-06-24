// Middleware to check user role
exports.checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No authentication token, authorization denied' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: 'User role not authorized' });
    }

    next();
  };
}; 