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
      enum: ['active', 'inactive', 'expired', 'completed', 'cancelled', 'paused', 'failed'],
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
    deadlineAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    inactivityMarkedAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    trackingMissedCount: {
      type: Number,
      default: 0,
    },
    trackingWarningCount: {
      type: Number,
      default: 0,
    },
    lastTrackingWarningAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// Prevent duplicate assignments
assignmentSchema.index({ request: 1, finder: 1 }, { unique: true });

module.exports = mongoose.model('FinderAssignment', assignmentSchema);
