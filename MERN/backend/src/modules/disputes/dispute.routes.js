const express = require('express');
const disputeController = require('./dispute.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * POST /api/disputes/create
 * Raised by owner or finder
 */
router.post('/create', verifyToken, disputeController.createDispute);

/**
 * GET /api/disputes/:assignmentId
 */
router.get('/:assignmentId', verifyToken, disputeController.getDispute);

/**
 * POST /api/disputes/resolve/:disputeId
 * Admin only
 */
router.post(
  '/resolve/:disputeId',
  verifyToken,
  checkRole('admin'),
  disputeController.resolveDispute
);

module.exports = router;
