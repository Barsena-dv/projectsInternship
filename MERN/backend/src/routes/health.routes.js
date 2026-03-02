const express = require('express');
const router = express.Router();

/**
 * Health Check Route
 * GET /api/health
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
