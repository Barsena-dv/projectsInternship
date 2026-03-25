const express = require('express');
const chatController = require('./chat.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { uploadSingle } = require('../../middleware/upload.middleware');

const router = express.Router();

router.post('/conversation', verifyToken, chatController.getOrCreateConversation);
router.get('/conversations', verifyToken, chatController.listConversations);

router.post(
  '/:conversationId/send',
  verifyToken,
  uploadSingle,
  chatController.sendMessage
);

router.get('/:conversationId/messages', verifyToken, chatController.getMessages);

module.exports = router;
