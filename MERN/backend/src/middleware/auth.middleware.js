const { verifyToken: verifyJwtToken } = require('../utils/jwt');
const User = require('../modules/users/user.model');

/**
 * Verify JWT token from Authorization header
 * Attaches user info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = verifyJwtToken(token);

    const user = await User.findById(decoded.userId).select('accountStatus activeSessions');
    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User session is not active',
      });
    }

    // For newer tokens, sessionId must exist in active session registry.
    if (decoded.sessionId) {
      const hasSession = (user.activeSessions || []).some(
        (session) => String(session.sessionId) === String(decoded.sessionId)
      );
      if (!hasSession) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again',
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = { verifyToken };
