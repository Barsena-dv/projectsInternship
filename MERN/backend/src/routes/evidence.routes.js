const express = require('express');
const router = express.Router();
const { getEvidence } = require('../controllers/evidence.controller');

/**
 * Evidence Routes
 * Mounted at /api/evidence
 */
router.get('/', getEvidence);

module.exports = router;
