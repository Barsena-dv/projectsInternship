const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      text: String,
      timestamp: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

conversationSchema.index({ assignment: 1 });
conversationSchema.index({ owner: 1, finder: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
