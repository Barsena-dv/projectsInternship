const express = require('express');
const auditLogController = require('./auditLog.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

// User specific activity
router.get('/my', verifyToken, auditLogController.getMyActivity);

// Admin only route
router.get(
  '/',
  verifyToken,
  checkRole('admin'),
  auditLogController.getAuditLogs
);

module.exports = router;
