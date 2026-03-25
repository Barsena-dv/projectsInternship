const express = require('express');
const trackingController = require('./tracking.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/tracking/update
 * Finder sends a status update
 */
router.post('/update', verifyToken, trackingController.updateTracking);

/**
 * GET /api/tracking/:assignmentId
 * Get tracking history for an assignment
 */
router.get('/:assignmentId', verifyToken, trackingController.getTrackingByAssignment);

module.exports = router;
