const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @param {String} role - User role
 */
const generateToken = (userId, role, sessionId = null) => {
  return jwt.sign(
    {
      userId,
      role,
      sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
