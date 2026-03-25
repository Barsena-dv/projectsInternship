const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
    },
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    evidenceSubmitted: {
      type: Boolean,
      default: false,
    },
    evidenceVerified: {
      type: Boolean,
      default: false,
    },
    chatUnlocked: {
      type: Boolean,
      default: false,
    },
    unlockTime: {
      type: Date,
      default: null,
    },
    isDisputed: {
      type: Boolean,
      default: false,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

// Prevent duplicate assignments
assignmentSchema.index({ request: 1, finder: 1 }, { unique: true });

module.exports = mongoose.model('FinderAssignment', assignmentSchema);
