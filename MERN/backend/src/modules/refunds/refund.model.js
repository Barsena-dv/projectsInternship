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
        },
        refundStatus: {
            type: String,
            enum: ["initiated", "processing", "completed"],
            default: "initiated",
        },
        refundRef: {
            type: String,
            trim: true,
        },
        initiatedAt: {
            type: Date,
            default: Date.now,
        },
        refundedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Refund", refundSchema);
