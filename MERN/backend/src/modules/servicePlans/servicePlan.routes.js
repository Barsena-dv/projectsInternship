const express = require('express');
const servicePlanController = require('./servicePlan.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * POST /api/plans
 * Only admin can create service plans
 */
router.post(
  '/',
  verifyToken,
  checkRole('admin'),
  servicePlanController.createPlan
);

/**
 * GET /api/plans
 * Get all active service plans
 */
router.get('/', servicePlanController.getAllPlans);

module.exports = router;
