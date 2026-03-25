const User = require('./user.model');
const { createNotification } = require('../notifications/notification.service');

/**
 * Get user profile and stats
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Update user's own profile details
 */
const updateUserProfile = async (userId, updateData) => {
  const { full_name, phone } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Prevent restricted field updates
  if (updateData.role || updateData.isVerified || updateData.accountStatus) {
    throw new Error('Cannot update sensitive fields directly');
  }

  // Handle unique phone update
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new Error('Phone number is already in use by another user');
    }
    user.phone = phone;
  }

  if (full_name) user.full_name = full_name;

  await user.save();
  return user;
};

/**
 * Update user profile image
 */
const updateProfileImage = async (userId, imageUrl) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.profileImage = { url: imageUrl };
  await user.save();
  return user;
};

/**
 * Update finder's current location
 */
const updateLocation = async (userId, lat, lng) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      currentLocation: { lat, lng },
    },
    { new: true }
  );

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * ADMIN: Get all users with basic filtering
 */
const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.accountStatus) query.accountStatus = filters.accountStatus;
  if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;

  return User.find(query).sort({ createdAt: -1 });
};

/**
 * ADMIN: Get single user by ID
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  return user;
};

/**
 * ADMIN: Update user account status
 */
const updateUserStatus = async (userId, status) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const oldStatus = user.accountStatus;
  user.accountStatus = status;
  await user.save();

  if (oldStatus !== status) {
    try {
      await createNotification({
        userId: user._id,
        type: 'account',
        title: 'Account Status Updated',
        message: `Your account status has been updated to: ${status.toUpperCase()}.`,
      });
    } catch (err) {
      console.error('Notification failed:', err.message);
    }
  }

  return user;
};

/**
 * ADMIN: Manually verify a finder account
 */
const verifyFinder = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.role !== 'finder') {
    throw new Error('Verification is only applicable to finder accounts');
  }

  user.isVerified = true;
  await user.save();

  try {
    await createNotification({
      userId: user._id,
      type: 'account',
      title: 'Identity Verified',
      message: 'Congratulations! Your finder identity has been successfully verified.',
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return user;
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  updateLocation,
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyFinder,
};
