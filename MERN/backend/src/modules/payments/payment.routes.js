const express = require('express');
const paymentController = require('./payment.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/create', verifyToken, paymentController.createPayment);

router.post('/:paymentId/process', verifyToken, paymentController.processPayment);

router.post('/:paymentId/release', verifyToken, paymentController.releasePayment);

router.get('/my', verifyToken, paymentController.getUserPayments);

module.exports = router;
