const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'wrong_item',
        'fake_evidence',
        'incomplete_item',
        'payment_not_released',
        'unfair_rejection',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    adminDecision: {
      type: String,
      enum: ['owner_wins', 'finder_wins'],
    },
    evidenceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvidenceFile',
    },
    resolvedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

disputeSchema.index({ assignment: 1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
