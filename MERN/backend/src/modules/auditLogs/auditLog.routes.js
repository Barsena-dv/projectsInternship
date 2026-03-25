const express = require('express');
const auditLogController = require('./auditLog.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin only route
router.get(
  '/',
  verifyToken,
  checkRole('admin'),
  auditLogController.getAuditLogs
);

module.exports = router;
