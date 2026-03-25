const express = require('express');
const ratingController = require('./rating.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/create', verifyToken, ratingController.createRating);
router.get('/user/:userId', ratingController.getUserRatings);

module.exports = router;
