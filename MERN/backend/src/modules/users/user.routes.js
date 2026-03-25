const express = require('express');
const userController = require('./user.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * User Self-Service Routes (Authenticated only)
 */
router.get('/me', verifyToken, userController.getMe);
router.patch('/me', verifyToken, userController.updateMe);
router.patch('/profile-image', verifyToken, userController.updateProfileImage);
router.patch('/location', verifyToken, userController.updateLocation);

/**
 * Admin Management Routes (Admin only)
 */
router.get('/', verifyToken, checkRole('admin'), userController.adminGetAllUsers);
router.get('/:id', verifyToken, checkRole('admin'), userController.adminGetUserById);
router.patch('/:id/status', verifyToken, checkRole('admin'), userController.adminUpdateStatus);
router.patch('/:id/verify-finder', verifyToken, checkRole('admin'), userController.adminVerifyFinder);

module.exports = router;
