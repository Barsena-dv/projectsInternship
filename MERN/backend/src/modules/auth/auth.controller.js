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
    const message = error.message;
    let statusCode = 401; // Default for login failures

    if (message.includes('Account is')) {
      statusCode = 403; // Forbidden (Suspended/Inactive)
    } else if (message.includes('not allowed')) {
      statusCode = 403;
    } else if (message.includes('not found')) {
      statusCode = 404;
    }

    res.status(statusCode).json({ success: false, message });
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
    let updateData = { ...req.body };

    // Handle profile image upload if file is present
    if (req.file) {
      const { uploadToCloudinary } = require('../../config/cloudinary');
      const { Readable } = require('stream');
      
      const fileStream = new Readable();
      fileStream.push(req.file.buffer);
      fileStream.push(null);
      
      const cloudinaryResult = await uploadToCloudinary(fileStream, 'profiles', `user_${req.user.userId}`);
      
      updateData.profileImage = {
        url: cloudinaryResult.secure_url,
        cloudinaryId: cloudinaryResult.public_id,
      };
    }

    const user = await authService.updateProfile(req.user.userId, updateData);
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Please provide an email address');
    
    await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email!',
    });
  } catch (error) {
    // Return 200 even for non-existent emails to prevent email enumeration, but with a different message
    if (error.message.includes('no user')) {
       res.status(200).json({ success: true, message: 'Password reset token sent to email!' });
       return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) throw new Error('Please provide a new password');

    await authService.resetPassword(token, password);
    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
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
  forgotPassword,
  resetPassword,
};
