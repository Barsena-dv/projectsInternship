const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LostItemRequest",
            required: true,
        },
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ratingValue: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        reviewText: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
ratingSchema.index({ requestId: 1 });
ratingSchema.index({ toUserId: 1 });
ratingSchema.index({ fromUserId: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
