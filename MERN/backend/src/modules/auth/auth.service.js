const User = require('../users/user.model');
const { hashPassword, comparePassword } = require('../../utils/passwordHash');
const { generateToken } = require('../../utils/jwt');
const { sendFinderOtpEmail, sendPasswordResetEmail } = require('../../utils/mailer');
const { applyTrustEvent, getTrustBadge } = require('../../utils/trust');
const crypto = require('crypto');

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

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
    isEmailVerified: role === 'finder' ? false : true,
    verificationLevel: role === 'finder' ? 'pending_verification' : 'basic_verified',
    finderStatus: role === 'finder' ? 'pending_verification' : 'verified',
    trustScore: role === 'finder' ? 0 : 10,
    trustBadge: role === 'finder' ? 'basic_user' : getTrustBadge(10),
    accountStatus: 'active',
  });

  if (role === 'finder') {
    const otp = generateOtp();
    user.emailVerificationOtp = hashOtp(otp);
    user.emailVerificationOtpExpiry = new Date(Date.now() + (10 * 60 * 1000));
    await user.save();
    await sendFinderOtpEmail(user.email, user.full_name, otp);
  }

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
const login = async (email, password, sessionMeta = {}) => {
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
  const sessionId = crypto.randomUUID();
  const sessionRecord = {
    sessionId,
    userAgent: String(sessionMeta.userAgent || '').slice(0, 500),
    ipAddress: String(sessionMeta.ipAddress || '').slice(0, 100),
    createdAt: new Date(),
    lastActiveAt: new Date(),
  };

  const previousSessions = Array.isArray(user.activeSessions) ? user.activeSessions : [];
  user.activeSessions = [sessionRecord, ...previousSessions].slice(0, 10);
  await user.save();

  const token = generateToken(user._id, user.role, sessionId);

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

/**
 * Forgot password - Generate token and send email
 */
const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  
  if (!user) {
    throw new Error('There is no user with that email address');
  }

  // 1. Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2. Hash it and save to DB
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // 3. Send email with unhashed token
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  try {
    await sendPasswordResetEmail(user.email, user.full_name, resetUrl);
    return true;
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error('There was an error sending the email. Try again later.');
  }
};

/**
 * Reset password - Verify token and save new password
 */
const resetPassword = async (token, newPassword) => {
  // 1. Hash the incoming token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 2. Find user by token & check if expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  // 3. Set new password
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return true;
};

const resendFinderEmailOtp = async (email) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || user.role !== 'finder') {
    throw new Error('Finder account not found');
  }

  const otp = generateOtp();
  user.emailVerificationOtp = hashOtp(otp);
  user.emailVerificationOtpExpiry = new Date(Date.now() + (10 * 60 * 1000));
  await user.save();
  await sendFinderOtpEmail(user.email, user.full_name, otp);

  return true;
};

const verifyFinderEmailOtp = async (email, otpCode) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || user.role !== 'finder') {
    throw new Error('Finder account not found');
  }

  if (!user.emailVerificationOtp || !user.emailVerificationOtpExpiry) {
    throw new Error('No verification code found. Please request a new OTP.');
  }

  if (new Date(user.emailVerificationOtpExpiry).getTime() < Date.now()) {
    throw new Error('Verification code expired. Please request a new OTP.');
  }

  if (hashOtp(otpCode) !== user.emailVerificationOtp) {
    throw new Error('Invalid verification code');
  }

  user.isEmailVerified = true;
  user.verificationLevel = ['id_verified', 'advanced_verified'].includes(String(user.verificationLevel))
    ? user.verificationLevel
    : 'basic_verified';
  user.finderStatus = user.isVerified ? 'verified' : 'pending_verification';
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpiry = undefined;
  applyTrustEvent(user, 'EMAIL_VERIFIED');
  await user.save();

  return {
    isEmailVerified: user.isEmailVerified,
    verificationLevel: user.verificationLevel,
    trustScore: user.trustScore,
    trustBadge: user.trustBadge,
  };
};

const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.activeSessions = [];
  await user.save();
  return true;
};

const updatePreferences = async (userId, payload = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const notifications = payload.notificationPreferences || {};
  const privacy = payload.privacySettings || {};

  if (Object.prototype.hasOwnProperty.call(notifications, 'finderApplied')) user.notificationPreferences.finderApplied = Boolean(notifications.finderApplied);
  if (Object.prototype.hasOwnProperty.call(notifications, 'trackingUpdate')) user.notificationPreferences.trackingUpdate = Boolean(notifications.trackingUpdate);
  if (Object.prototype.hasOwnProperty.call(notifications, 'evidenceUpdate')) user.notificationPreferences.evidenceUpdate = Boolean(notifications.evidenceUpdate);
  if (Object.prototype.hasOwnProperty.call(notifications, 'paymentUpdate')) user.notificationPreferences.paymentUpdate = Boolean(notifications.paymentUpdate);
  if (Object.prototype.hasOwnProperty.call(notifications, 'disputeUpdate')) user.notificationPreferences.disputeUpdate = Boolean(notifications.disputeUpdate);
  if (Object.prototype.hasOwnProperty.call(notifications, 'marketingAnnouncements')) user.notificationPreferences.marketingAnnouncements = Boolean(notifications.marketingAnnouncements);

  if (Object.prototype.hasOwnProperty.call(privacy, 'profileVisibility')) {
    const visibility = String(privacy.profileVisibility || 'limited');
    if (!['public', 'limited', 'private'].includes(visibility)) {
      throw new Error('profileVisibility must be public, limited, or private');
    }
    user.privacySettings.profileVisibility = visibility;
  }
  if (Object.prototype.hasOwnProperty.call(privacy, 'activityHistoryVisible')) {
    user.privacySettings.activityHistoryVisible = Boolean(privacy.activityHistoryVisible);
  }

  await user.save();
  return {
    notificationPreferences: user.notificationPreferences,
    privacySettings: user.privacySettings,
  };
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  resendFinderEmailOtp,
  verifyFinderEmailOtp,
  logoutAllDevices,
  updatePreferences,
};
