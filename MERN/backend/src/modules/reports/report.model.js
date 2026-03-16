const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LostItemRequest",
            required: true,
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinderAssignment",
            required: true,
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportType: {
            type: String,
            enum: ["fraud", "misconduct", "spam", "other"],
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        evidencePath: {
            type: String,
            trim: true,
            default: null,
        },
        reportStatus: {
            type: String,
            enum: ["open", "reviewing", "resolved"],
            default: "open",
        },
        handledByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        resolvedAt: {
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
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ requestId: 1 });
reportSchema.index({ reportStatus: 1 });

module.exports = mongoose.model("Report", reportSchema);
