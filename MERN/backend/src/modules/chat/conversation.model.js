const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
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
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        conversationStatus: {
            type: String,
            enum: ["locked", "active", "closed"],
            default: "locked",
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        activatedAt: {
            type: Date,
            default: null,
        },
        closedAt: {
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
conversationSchema.index({ requestId: 1 });
conversationSchema.index({ assignmentId: 1 });
conversationSchema.index({ ownerId: 1 });
conversationSchema.index({ finderId: 1 });
conversationSchema.index({ conversationStatus: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
