const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['assignment', 'evidence', 'payment', 'system', 'account', 'dispute', 'tracking', 'deadline', 'inactivity'],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    data: {
      requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostItemRequest',
      },
      assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinderAssignment',
      },
      evidenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EvidenceFile',
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
