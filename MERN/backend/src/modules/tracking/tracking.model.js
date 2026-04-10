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
      enum: ['progress', 'location_ping', 'manual_note', 'skip'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['auto', 'prompt', 'manual'],
      default: 'manual',
    },
    locationSource: {
      type: String,
      enum: ['current', 'manual_text', 'skipped', 'none'],
      default: 'none',
    },
    locationName: {
      type: String,
      trim: true,
      default: '',
    },
    currentLat: {
      type: Number,
      default: null,
    },
    currentLng: {
      type: Number,
      default: null,
    },
    remarks: String,
    anomalyFlag: {
      type: Boolean,
      default: false,
    },
    anomalyReason: {
      type: String,
      default: '',
    },
    speedKmph: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

trackingUpdateSchema.index({ assignmentId: 1, createdAt: -1 });

module.exports = mongoose.model('TrackingUpdate', trackingUpdateSchema);
