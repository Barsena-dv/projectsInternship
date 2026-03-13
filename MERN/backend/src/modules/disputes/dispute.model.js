const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
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
            required: true,
        },
        reportDescription: {
            type: String,
            required: true,
        },
        evidencePath: {
            type: String,
            trim: true,
        },
        reportStatus: {
            type: String,
            enum: ["open", "under_review", "resolved"],
            default: "open",
        },
        handledByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Dispute", disputeSchema);
