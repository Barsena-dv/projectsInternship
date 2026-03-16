const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinderAssignment",
            required: true,
        },
        uploaderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fileType: {
            type: String,
            enum: ["photo", "video"],
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        caption: {
            type: String,
            trim: true,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
evidenceSchema.index({ assignmentId: 1 });
evidenceSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model("EvidenceFile", evidenceSchema);
