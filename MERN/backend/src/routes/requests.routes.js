const express = require('express');
const router = express.Router();
const { getRequests } = require('../controllers/request.controller');

/**
 * Request Routes
 * Mounted at /api/requests
 */
router.get('/', getRequests);

module.exports = router;
