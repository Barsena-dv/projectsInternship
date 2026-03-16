const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinderAssignment",
            required: true,
        },
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        statusUpdate: {
            type: String,
            enum: ["searching", "near_location", "item_found", "search_failed"],
            required: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
milestoneSchema.index({ assignmentId: 1 });
milestoneSchema.index({ finderId: 1 });
milestoneSchema.index({ location: "2dsphere" }, { sparse: true });

module.exports = mongoose.model("Milestone", milestoneSchema);
