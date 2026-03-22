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
            enum: ["accepted", "evidence_submitted", "completed", "rejected"],
            default: "accepted",
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        evidenceSubmitted: {
            type: Boolean,
            default: false,
        },
        evidenceSubmittedAt: {
            type: Date,
            default: null,
        },
        ownerConfirmation: {
            type: String,
            enum: ["pending", "confirmed", "rejected"],
            default: "pending",
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
