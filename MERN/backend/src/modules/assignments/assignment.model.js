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
            enum: ["system", "admin"],
            required: true,
        },
        assignmentStatus: {
            type: String,
            enum: ["accepted", "searching", "found", "failed", "completed"],
            default: "accepted",
        },
        evidenceSubmitted: {
            type: Boolean,
            default: false,
        },
        ownerConfirmation: {
            type: String,
            enum: ["pending", "confirmed", "rejected"],
            default: "pending",
        },
        acceptedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
assignmentSchema.index({ finderId: 1 });
assignmentSchema.index({ requestId: 1 });
assignmentSchema.index({ assignmentStatus: 1 });

module.exports = mongoose.model("FinderAssignment", assignmentSchema);
