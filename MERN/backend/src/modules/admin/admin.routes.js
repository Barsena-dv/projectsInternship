const express = require('express');
const adminController = require('./admin.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

// All routes are admin-only
router.use(verifyToken, checkRole('admin'));

/**
 * Platform Monitoring
 */
router.get('/dashboard', adminController.getDashboardStats);
router.get('/disputes', adminController.getAllDisputes);

/**
 * Dispute Resolution
 */
router.post('/disputes/:disputeId/resolve', adminController.resolveDispute);

/**
 * User & Finder Management
 */
router.post('/finder/:userId/verify', adminController.verifyFinder);
router.patch('/user/:userId/status', adminController.updateUserStatus);

module.exports = router;
