const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        docType: {
            type: String,
            required: true,
            trim: true,
        },
        docNumber: {
            type: String,
            required: true,
            trim: true,
        },
        filePath: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const finderVerificationSchema = new mongoose.Schema(
    {
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        documents: {
            type: [documentSchema],
            default: [],
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: null,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        verifiedByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        verifiedAt: {
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
finderVerificationSchema.index({ finderId: 1 });
finderVerificationSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model("FinderVerification", finderVerificationSchema);
