const chatService = require('./chat.service');

const getOrCreateConversation = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const userId = req.user.userId;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: 'Assignment ID is required' });
    }

    const conversation = await chatService.getOrCreateConversationForUser(assignmentId, userId);

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    const status = String(error.message || '').includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

const listConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await chatService.listConversationsForUser(userId);
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, attachment } = req.body;
    const senderId = req.user.userId;

    if (!text && !attachment) {
      return res.status(400).json({ success: false, message: 'Message text or attachment is required' });
    }

    const message = await chatService.sendMessage(conversationId, senderId, text, attachment);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.userId;

    const result = await chatService.getMessages(
      conversationId,
      userId,
      parseInt(page) || 1,
      parseInt(limit) || 50
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = String(error.message || '').includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  listConversations,
  sendMessage,
  getMessages,
};
