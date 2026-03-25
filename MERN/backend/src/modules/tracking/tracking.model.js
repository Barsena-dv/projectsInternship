const mongoose = require('mongoose');

const trackingUpdateSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusUpdate: {
      type: String,
      enum: ['searching', 'near_location', 'item_found', 'search_failed'],
      required: true,
    },
    currentLat: {
      type: Number,
      required: true,
    },
    currentLng: {
      type: Number,
      required: true,
    },
    remarks: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

trackingUpdateSchema.index({ assignmentId: 1, createdAt: -1 });

module.exports = mongoose.model('TrackingUpdate', trackingUpdateSchema);
