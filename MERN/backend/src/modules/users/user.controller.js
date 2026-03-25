const userService = require('./user.service');

/**
 * Self-service: Get my profile
 */
const getMe = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * Self-service: Update my profile
 */
const updateMe = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Self-service: Update profile image
 */
const updateProfileImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) throw new Error('Image URL is required');

    const user = await userService.updateProfileImage(req.user.userId, url);
    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: { profileImage: user.profileImage },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Self-service: Update current location (Finder only)
 */
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.userId;

    if (lat === undefined || lng === undefined) {
      throw new Error('Latitude and Longitude are required');
    }

    const user = await userService.updateLocation(userId, lat, lng);
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: { currentLocation: user.currentLocation },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN: Get all users
 */
const adminGetAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN: Get user details
 */
const adminGetUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN: Update account status
 */
const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: { accountStatus: user.accountStatus },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN: Manually verify finder
 */
const adminVerifyFinder = async (req, res) => {
  try {
    const user = await userService.verifyFinder(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Finder verified successfully',
      data: { isVerified: user.isVerified },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMe,
  updateMe,
  updateProfileImage,
  updateLocation,
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateStatus,
  adminVerifyFinder,
};
