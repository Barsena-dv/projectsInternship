const User = require('../users/user.model');
const { hashPassword, comparePassword } = require('../../utils/passwordHash');
const { generateToken } = require('../../utils/jwt');

/**
 * Register new user
 */
const register = async (userData) => {
  const { full_name, email, phone, password, role } = userData;

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if email already exists
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new Error('User already exists with this email');
  }

  // 2. Check if phone already exists
  const existingPhone = await User.findOne({ phone: phone.trim() });
  if (existingPhone) {
    throw new Error('User already exists with this phone number');
  }

  // 3. Prevent admin registration via API
  if (role === 'admin') {
    throw new Error('Admin registration is not allowed');
  }

  // 4. Hash password
  const hashedPassword = await hashPassword(password);

  // 5. Create user
  const user = await User.create({
    full_name: full_name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    role: role || 'owner',
    isVerified: role === 'finder' ? false : true,
    accountStatus: 'active',
  });

  return {
    id: user._id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user exists
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. Check accountStatus
  if (user.accountStatus !== 'active') {
    throw new Error(`Account is ${user.accountStatus}. Please contact support.`);
  }

  // 3. Verify password
  const isPasswordMatch = await comparePassword(password, user.password);
  if (!isPasswordMatch) {
    throw new Error('Invalid credentials');
  }

  // 4. Generate token
  const token = generateToken(user._id, user.role);

  // 5. Build user data (excluding password)
  const userData = user.toObject();
  delete userData.password;

  return {
    token,
    user: userData,
  };
};

/**
 * Get current user
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
};

/**
 * Update profile
 */
const updateProfile = async (userId, updateData) => {
  const { full_name, phone, profileImage } = updateData;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Check unique phone if it's changing
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) throw new Error('Phone number already in use');
    user.phone = phone;
  }

  if (full_name) user.full_name = full_name;
  if (profileImage) user.profileImage = profileImage;

  await user.save();
  return user;
};

/**
 * Change password
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new Error('User not found');

  // Verify old password
  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) throw new Error('Current password incorrect');

  // Hash and save new
  user.password = await hashPassword(newPassword);
  await user.save();
  return true;
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
