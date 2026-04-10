const express = require('express');
const requestController = require('./request.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const router = express.Router();

// Owner actions
router.post('/create', verifyToken, requestController.createRequest);
router.get('/my', verifyToken, requestController.getMyRequests);
router.post('/:id/publish', verifyToken, requestController.publishRequest);
router.patch('/:id', verifyToken, requestController.updateRequest);
router.delete('/:id', verifyToken, requestController.deleteRequest);

// Public/Discovery actions
router.get('/available', verifyToken, requestController.getAvailableRequests);
router.get('/:id', verifyToken, requestController.getRequestById);

module.exports = router;
