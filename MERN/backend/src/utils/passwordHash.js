const bcrypt = require('bcryptjs');

/**
 * Hash password
 * @param {String} password - Plain password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain password
 * @param {String} hash - Hashed password
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
