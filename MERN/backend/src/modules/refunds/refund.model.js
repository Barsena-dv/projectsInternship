const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
    {
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
        },
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LostItemRequest",
            required: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        refundAmount: {
            type: Number,
            required: true,
        },
        refundType: {
            type: String,
            enum: ["partial", "full"],
            required: true,
        },
        refundReason: {
            type: String,
            required: true,
            trim: true,
        },
        refundStatus: {
            type: String,
            enum: ["initiated", "processed", "failed"],
            default: "initiated",
        },
        refundReference: {
            type: String,
            trim: true,
            default: null,
        },
        initiatedAt: {
            type: Date,
            default: Date.now,
        },
        refundedAt: {
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
refundSchema.index({ paymentId: 1 });
refundSchema.index({ requestId: 1 });
refundSchema.index({ ownerId: 1 });
refundSchema.index({ refundStatus: 1 });

module.exports = mongoose.model("Refund", refundSchema);
