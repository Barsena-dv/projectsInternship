const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
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
        itemName: {
            type: String,
            required: true,
            trim: true,
        },
        itemCategory: {
            type: String,
            required: true,
        },
        itemDescription: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            trim: true,
        },
        model: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            trim: true,
        },
        uniqueIdentifiers: {
            type: String,
            trim: true,
        },
        serialNumber: {
            type: String,
            trim: true,
        },
        lastSeenLocation: {
            type: String,
            required: true,
        },
        lastSeenLat: {
            type: Number,
            required: true,
        },
        lastSeenLng: {
            type: Number,
            required: true,
        },
        lastSeenDatetime: {
            type: Date,
            required: true,
        },
        serviceDeadline: {
            type: Date,
            required: true,
        },
        requestStatus: {
            type: String,
            enum: [
                "pending_payment",
                "open",
                "assigned",
                "evidence_uploaded",
                "awaiting_confirmation",
                "completed",
                "expired",
            ],
            default: "pending_payment",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("LostItemRequest", requestSchema);
