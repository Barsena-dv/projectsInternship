const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundPercentage: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ['item_not_found', 'owner_cancelled', 'not_confirmed', 'manual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'processed', 'completed', 'failed'],
      default: 'created',
    },
    transactionId: String,
    processedAt: Date,
    failureReason: String,
  },
  { timestamps: true, versionKey: false }
);

refundSchema.index({ owner: 1, status: 1 });
refundSchema.index({ payment: 1 });

module.exports = mongoose.model('Refund', refundSchema);
