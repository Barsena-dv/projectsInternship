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
        payoutReference: {
            type: String,
            trim: true,
            default: null,
        },
        processedAt: {
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
payoutSchema.index({ finderId: 1 });
payoutSchema.index({ paymentId: 1 });
payoutSchema.index({ assignmentId: 1 });
payoutSchema.index({ payoutStatus: 1 });

module.exports = mongoose.model("Payout", payoutSchema);
