const express = require('express');
const router = express.Router();
const { getApplications } = require('../controllers/application.controller');

/**
 * Application Routes
 * Mounted at /api/application
 */
router.get('/', getApplications);

module.exports = router;
