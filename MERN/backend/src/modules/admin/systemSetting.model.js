const mongoose = require('mongoose');

const adminSystemSettingSchema = new mongoose.Schema(
  {
    defaultAssignmentDeadlineHours: {
      type: Number,
      default: 4,
      min: 1,
      max: 168,
    },
    trackingIntervalMinutes: {
      type: Number,
      default: 15,
      min: 1,
      max: 120,
    },
    maxEvidenceImages: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    maxEvidenceVideoSeconds: {
      type: Number,
      default: 120,
      min: 30,
      max: 900,
    },
    disputeWindowHours: {
      type: Number,
      default: 48,
      min: 1,
      max: 720,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('AdminSystemSetting', adminSystemSettingSchema);
