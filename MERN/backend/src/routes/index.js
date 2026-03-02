const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const requestsRoutes = require('./requests.routes');
const applicationsRoutes = require('./applications.routes');
const escrowRoutes = require('./escrow.routes');
const evidenceRoutes = require('./evidence.routes');
const disputesRoutes = require('./disputes.routes');

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/requests', requestsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/escrow', escrowRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/disputes', disputesRoutes);

module.exports = router;
