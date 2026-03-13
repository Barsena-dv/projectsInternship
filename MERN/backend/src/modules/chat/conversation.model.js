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
        },
        closedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Conversation", conversationSchema);
