/**
 * Restrict access to specific roles
 * Usage: checkRole('owner', 'finder')
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // For 'both' role, allow access to all endpoints
      if (userRole === 'both' || allowedRoles.includes(userRole)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking role',
      });
    }
  };
};

module.exports = { checkRole };
