const mongoose = require('mongoose');

const assignmentTimelineEventSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: false,
      default: null,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
      index: true,
    },
    actor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      role: {
        type: String,
        enum: ['owner', 'finder', 'admin', 'system'],
        default: 'system',
      },
      label: {
        type: String,
        trim: true,
        default: 'System',
      },
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

assignmentTimelineEventSchema.index({ request: 1, createdAt: -1 });
assignmentTimelineEventSchema.index({ assignment: 1, createdAt: -1 });

module.exports = mongoose.model('AssignmentTimelineEvent', assignmentTimelineEventSchema);
