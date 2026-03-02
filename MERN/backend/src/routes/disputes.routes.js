const express = require('express');
const router = express.Router();
const { getDisputes } = require('../controllers/dispute.controller');

/**
 * Dispute Routes
 * Mounted at /api/disputes
 */
router.get('/', getDisputes);

module.exports = router;
