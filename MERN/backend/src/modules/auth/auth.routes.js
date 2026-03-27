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

// Private routes
router.get('/me', verifyToken, authController.getMe);
router.patch('/update-profile', verifyToken, authController.updateProfile);
router.patch('/change-password', verifyToken, authController.changePassword);

module.exports = router;
