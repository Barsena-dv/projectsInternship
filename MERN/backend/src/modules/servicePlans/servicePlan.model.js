const mongoose = require("mongoose");

const servicePlanSchema = new mongoose.Schema(
    {
        planName: {
            type: String,
            enum: ["basic", "premium"],
            required: true,
            trim: true,
        },
        refundPercent: {
            type: Number,
            required: true,
        },
        platformPercent: {
            type: Number,
            required: true,
        },
        finderPercent: {
            type: Number,
            required: true,
        },
        priorityLevel: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
servicePlanSchema.index({ planName: 1 });
servicePlanSchema.index({ isActive: 1 });

module.exports = mongoose.model("ServicePlan", servicePlanSchema);
