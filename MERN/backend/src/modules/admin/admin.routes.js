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

/**
 * User Management
 */
router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserProfile);
router.post('/finder/:userId/verify', adminController.verifyFinder);
router.patch('/user/:userId/status', adminController.updateUserStatus);

/**
 * Request Management
 */
router.get('/requests', adminController.listRequests);
router.get('/requests/:requestId', adminController.getRequestDetails);
router.delete('/requests/:requestId', adminController.deleteRequest);
router.post('/requests/:requestId/force-close', adminController.forceCloseRequest);
router.post('/requests/:requestId/reopen', adminController.reopenRequest);

/**
 * Assignment Monitoring
 */
router.get('/assignments', adminController.listAssignments);
router.get('/assignments/:assignmentId', adminController.getAssignmentDetails);
router.post('/assignments/:assignmentId/status', adminController.updateAssignmentStatus);
router.post('/assignments/:assignmentId/extend-deadline', adminController.extendAssignmentDeadline);
router.get('/tracking/assignments/:assignmentId/analytics', adminController.getTrackingAnalytics);

/**
 * Dispute Resolution
 */
router.get('/disputes', adminController.getAllDisputes);
router.get('/disputes/:disputeId', adminController.getDisputeDetails);
router.post('/disputes/:disputeId/resolve', adminController.resolveDispute);

/**
 * Payment Control
 */
router.get('/payments', adminController.listPayments);
router.get('/payments/:paymentId', adminController.getPaymentDetails);
router.post('/payments/:paymentId/force-release', adminController.forceReleasePayment);
router.post('/payments/:paymentId/refund', adminController.refundPayment);
router.post('/payments/:paymentId/flag', adminController.flagSuspiciousPayment);

/**
 * Audit, Notifications, Fraud Signals
 */
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/notifications', adminController.getNotifications);
router.post('/notifications/broadcast', adminController.broadcastNotifications);
router.get('/fraud-signals', adminController.getFraudSignals);

/**
 * System Settings
 */
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);

module.exports = router;
