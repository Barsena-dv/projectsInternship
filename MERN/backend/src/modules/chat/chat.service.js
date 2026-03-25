const Conversation = require('./conversation.model');
const Message = require('./message.model');
const FinderAssignment = require('../assignments/assignment.model');

const dedupeConversationsByAssignment = (conversations = []) => {
  const byAssignment = new Map();

  conversations.forEach((conversation) => {
    const assignmentId = String(conversation?.assignment?._id || conversation?.assignment || conversation?._id || '');
    if (!assignmentId) return;

    const previous = byAssignment.get(assignmentId);
    if (!previous) {
      byAssignment.set(assignmentId, conversation);
      return;
    }

    const previousUpdated = new Date(previous.updatedAt || previous.createdAt || 0).getTime();
    const currentUpdated = new Date(conversation.updatedAt || conversation.createdAt || 0).getTime();
    if (currentUpdated >= previousUpdated) {
      byAssignment.set(assignmentId, conversation);
    }
  });

  return Array.from(byAssignment.values()).sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
};

const ensureParticipant = (conversation, userId) => {
  const isOwner = conversation.owner.toString() === userId.toString();
  const isFinder = conversation.finder.toString() === userId.toString();

  if (!isOwner && !isFinder) {
    throw new Error('Unauthorized to access this conversation');
  }

  return { isOwner, isFinder };
};

const getOrCreateConversation = async (assignmentId, ownerId, finderId) => {
  let conversation = await Conversation.findOne({ assignment: assignmentId }).sort({ updatedAt: -1 });

  if (!conversation) {
    conversation = await Conversation.findOneAndUpdate(
      { assignment: assignmentId },
      {
        $setOnInsert: {
          assignment: assignmentId,
          owner: ownerId,
          finder: finderId,
          isActive: true,
        },
      },
      { new: true, upsert: true }
    );
  }

  return conversation;
};

const sendMessage = async (conversationId, senderId, text, attachment = null) => {
  const conversation = await Conversation.findById(conversationId).populate('assignment');
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  ensureParticipant(conversation, senderId);

  // Check if chat is unlocked for the associated assignment
  if (!conversation.assignment || !conversation.assignment.chatUnlocked) {
    throw new Error('Chat is locked. Owner must verify evidence before you can chat.');
  }

  if (!conversation.isActive || conversation.assignment.status === 'completed') {
    throw new Error('This chat has been closed');
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    attachment,
  });

  // Update last message in conversation
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: { text, timestamp: new Date() },
  });

  return message.populate('sender', 'full_name profileImage');
};

const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
  const conversation = await Conversation.findById(conversationId).populate({
    path: 'assignment',
    populate: { path: 'request', select: 'itemName _id' },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  ensureParticipant(conversation, userId);

  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'full_name profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Message.countDocuments({ conversation: conversationId });

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return {
    conversation: {
      _id: conversation._id,
      assignmentId: conversation.assignment?._id,
      requestId: conversation.assignment?.request?._id,
      requestTitle: conversation.assignment?.request?.itemName || 'Request',
      chatUnlocked: Boolean(conversation.assignment?.chatUnlocked),
      assignmentStatus: conversation.assignment?.status || 'active',
      isActive: Boolean(conversation.isActive),
      owner: conversation.owner,
      finder: conversation.finder,
      lastMessage: conversation.lastMessage,
    },
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const listConversationsForUser = async (userId) => {
  const conversations = await Conversation.find({
    $or: [{ owner: userId }, { finder: userId }],
  })
    .populate('owner', 'full_name profileImage')
    .populate('finder', 'full_name profileImage')
    .populate({
      path: 'assignment',
      populate: { path: 'request', select: 'itemName _id requestStatus' },
    })
    .sort({ updatedAt: -1 });

  const uniqueConversations = dedupeConversationsByAssignment(conversations);

  const rows = await Promise.all(
    uniqueConversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: userId },
        isRead: false,
      });

      return {
        _id: conversation._id,
        assignmentId: conversation.assignment?._id,
        requestId: conversation.assignment?.request?._id,
        requestTitle: conversation.assignment?.request?.itemName || 'Request',
        requestStatus: conversation.assignment?.request?.requestStatus,
        chatUnlocked: Boolean(conversation.assignment?.chatUnlocked),
        assignmentStatus: conversation.assignment?.status || 'active',
        isActive: Boolean(conversation.isActive),
        owner: conversation.owner,
        finder: conversation.finder,
        lastMessage: conversation.lastMessage,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    })
  );

  return rows;
};

const getOrCreateConversationForUser = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const isFinder = assignment.finder.toString() === userId.toString();
  const isOwner = assignment.request.owner.toString() === userId.toString();

  if (!isFinder && !isOwner) {
    throw new Error('Unauthorized to chat in this assignment');
  }

  return getOrCreateConversation(assignmentId, assignment.request.owner, assignment.finder);
};

const markAsRead = async (messageId) => {
  const message = await Message.findByIdAndUpdate(messageId, {
    isRead: true,
    readAt: new Date(),
  });

  return message;
};

module.exports = {
  getOrCreateConversation,
  getOrCreateConversationForUser,
  listConversationsForUser,
  sendMessage,
  getMessages,
  markAsRead,
};
