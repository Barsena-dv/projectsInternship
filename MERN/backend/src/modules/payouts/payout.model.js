const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    payoutAmount: {
      type: Number,
      required: true,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    payoutCategory: {
      type: String,
      enum: ['standard', 'compensation'],
      default: 'standard',
    },
    processedAt: Date,
    transactionId: String,
    remarks: String,
    settlementReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, versionKey: false }
);

payoutSchema.index({ finder: 1, payoutStatus: 1 });
payoutSchema.index({ payment: 1 }, { unique: true });

module.exports = mongoose.model('Payout', payoutSchema);
