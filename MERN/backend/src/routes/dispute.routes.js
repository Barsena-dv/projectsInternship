const express = require('express');
const router = express.Router();
const { getDisputes } = require('../controllers/dispute.controller');

/**
 * Dispute Routes
 * Mounted at /api/dispute
 */
router.get('/', getDisputes);

module.exports = router;
