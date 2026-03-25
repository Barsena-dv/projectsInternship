const express = require('express');
const refundController = require('./refund.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin only (refunds are typically triggered by admin resolution or system expiration)
router.post('/process/:paymentId', verifyToken, checkRole('admin'), refundController.processRefund);

module.exports = router;
