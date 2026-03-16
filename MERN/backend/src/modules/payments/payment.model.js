const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
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
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServicePlan",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["locked", "released", "refunded"],
            default: "locked",
        },
        transactionId: {
            type: String,
            trim: true,
            default: null,
        },
        gateway: {
            type: String,
            trim: true,
            default: null,
        },
        paidAt: {
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
paymentSchema.index({ requestId: 1 });
paymentSchema.index({ ownerId: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
