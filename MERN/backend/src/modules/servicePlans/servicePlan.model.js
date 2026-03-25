const mongoose = require('mongoose');

const servicePlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    refundPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    platformPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    finderPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    priorityLevel: {
      type: Number,
      default: 1,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ServicePlan', servicePlanSchema);
