const authService = require('./auth.service');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    const { token, user } = result;

    // Audit Log
    const auditLogService = require('../auditLogs/auditLog.service');
    auditLogService.logAction({
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.userId, oldPassword, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
