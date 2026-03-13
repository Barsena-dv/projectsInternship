const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
    {
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinderAssignment",
            required: true,
        },
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        payoutAmount: {
            type: Number,
            required: true,
        },
        payoutStatus: {
            type: String,
            enum: ["pending", "processed", "failed"],
            default: "pending",
        },
        payoutRef: {
            type: String,
            trim: true,
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Payout", payoutSchema);
