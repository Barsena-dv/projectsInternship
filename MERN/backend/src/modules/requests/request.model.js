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
      required: true,
      trim: true,
    },
    itemCategory: {
      type: String,
      required: true,
    },
    itemDescription: {
      type: String,
      required: true,
    },
    brand: String,
    model: String,
    color: String,
    uniqueIdentifiers: String,
    serialNumber: String,
    lastSeenLocation: String,
    lastSeenLat: {
      type: Number,
      required: true,
    },
    lastSeenLng: {
      type: Number,
      required: true,
    },
    lastSeenDatetime: Date,
    serviceDeadline: Date,
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePlan',
      required: true,
    },
    requestStatus: {
      type: String,
      enum: ['pending_payment', 'open', 'assigned', 'found', 'completed', 'cancelled'],
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
  },
  { timestamps: true, versionKey: false }
);

lostItemRequestSchema.index({ owner: 1, requestStatus: 1 });

module.exports = mongoose.model('LostItemRequest', lostItemRequestSchema);
