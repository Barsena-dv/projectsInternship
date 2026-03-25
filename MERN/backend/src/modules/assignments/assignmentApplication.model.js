const mongoose = require('mongoose');

const assignmentApplicationSchema = new mongoose.Schema(
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
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    applyReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    finderRegion: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    decisionReason: {
      type: String,
      default: '',
      trim: true,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

assignmentApplicationSchema.index({ request: 1, finder: 1 }, { unique: true });
assignmentApplicationSchema.index({ request: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('AssignmentApplication', assignmentApplicationSchema);
