const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    servicePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePlan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'locked', 'released', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'wallet'],
    },
    transactionId: String,
    paidAt: Date,
    releasedAt: Date,
    releaseReason: String,
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'completed'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    finderCompensationAmount: {
      type: Number,
      default: 0,
    },
    settlementType: {
      type: String,
      enum: ['none', 'expired_drop', 'failed_retry_refund', 'failed_drop'],
      default: 'none',
    },
    settlementReason: {
      type: String,
      default: '',
    },
    flaggedByAdmin: {
      type: Boolean,
      default: false,
    },
    flaggedReason: {
      type: String,
      default: '',
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index({ owner: 1, paymentStatus: 1 });
paymentSchema.index({ request: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
