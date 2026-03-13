const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LostItemRequest",
            required: true,
        },
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedBy: {
            type: String,
            required: true,
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        evidenceSubmitted: {
            type: Boolean,
            default: false,
        },
        userConfirmation: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        completionStatus: {
            type: String,
            enum: ["in_progress", "item_found", "search_failed", "cancelled"],
            default: "in_progress",
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("FinderAssignment", assignmentSchema);
