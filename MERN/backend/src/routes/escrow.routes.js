const express = require('express');
const router = express.Router();
const { getEscrow } = require('../controllers/escrow.controller');

/**
 * Escrow Routes
 * Mounted at /api/escrow
 */
router.get('/', getEscrow);

module.exports = router;
