const express = require('express');
const authController = require('./auth.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimit.middleware');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, authController.resetPassword);
router.post('/finder/resend-email-otp', authLimiter, authController.resendFinderEmailOtp);
router.post('/finder/verify-email-otp', authLimiter, authController.verifyFinderEmailOtp);

// Private routes
router.get('/me', verifyToken, authController.getMe);
const { uploadSingle } = require('../../middleware/upload.middleware');
router.patch('/update-profile', verifyToken, uploadSingle, authController.updateProfile);
router.patch('/change-password', verifyToken, authController.changePassword);
router.post('/logout-all-devices', verifyToken, authController.logoutAllDevices);
router.patch('/preferences', verifyToken, authController.updatePreferences);

module.exports = router;
