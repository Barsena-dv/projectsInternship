const mongoose = require('mongoose');

const lostItemRequestSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemName: {
      type: String,
      default: '',
      trim: true,
    },
    itemCategory: {
      type: String,
      default: '',
    },
    itemDescription: {
      type: String,
      default: '',
    },
    brand: String,
    model: String,
    color: String,
    uniqueIdentifiers: String,
    serialNumber: String,
    lastSeenLocation: String,
    lastSeenLat: {
      type: Number,
      default: null,
    },
    lastSeenLng: {
      type: Number,
      default: null,
    },
    lastSeenDatetime: Date,
    serviceDeadline: Date,
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePlan',
      default: null,
    },
    requestStatus: {
      type: String,
      enum: ['draft', 'pending_payment', 'open', 'assigned', 'found', 'completed', 'cancelled', 'failed'],
      default: 'pending_payment',
    },
    itemConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmationDate: Date,
    expiryDate: Date,
    finders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deadlineHours: {
      type: Number,
      default: 4,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

lostItemRequestSchema.index({ owner: 1, requestStatus: 1 });

module.exports = mongoose.model('LostItemRequest', lostItemRequestSchema);
