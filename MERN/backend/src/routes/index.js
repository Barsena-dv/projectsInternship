const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const requestRoutes = require('./request.routes');
const applicationRoutes = require('./application.routes');
const escrowRoutes = require('./escrow.routes');
const evidenceRoutes = require('./evidence.routes');
const disputeRoutes = require('./dispute.routes');

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/applications', applicationRoutes);
router.use('/escrow', escrowRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/disputes', disputeRoutes);

module.exports = router;
