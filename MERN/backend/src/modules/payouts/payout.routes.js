const express = require('express');
const payoutController = require('./payout.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin processes payouts
router.post('/process/:payoutId', verifyToken, checkRole('admin'), payoutController.processPayout);

// Finders can view their payouts
router.get('/my', verifyToken, payoutController.getMyPayouts);

module.exports = router;
