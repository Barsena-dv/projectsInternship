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
        paymentAmount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "locked",
                "released",
                "partially_refunded",
                "fully_refunded",
            ],
            default: "pending",
        },
        gatewayProvider: {
            type: String,
            trim: true,
        },
        gatewayPaymentRef: {
            type: String,
            trim: true,
        },
        escrowLockedAt: {
            type: Date,
        },
        releasedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
