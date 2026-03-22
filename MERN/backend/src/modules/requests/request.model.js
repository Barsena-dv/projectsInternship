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
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        assignmentId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "FinderAssignment",
                        default: null,
                },
        itemName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
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
        serialNumber: {
            type: String,
            trim: true,
        },
        uniqueIdentifiers: {
            type: String,
            trim: true,
        },
        rewardAmount: {
            type: Number,
            default: 0,
        },
        lastSeenLocation: {
            type: String,
            required: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        lastSeenDatetime: {
            type: Date,
            required: true,
        },
        serviceDeadline: {
            type: Date,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        requestStatus: {
            type: String,
            enum: [
                "draft",
                "open",
                "assigned",
                "found",
                "completed",
                "failed",
            ],
            default: "draft",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
requestSchema.index({ ownerId: 1 });
requestSchema.index({ categoryId: 1 });
requestSchema.index({ assignmentId: 1 });
requestSchema.index({ requestStatus: 1 });
requestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("LostItemRequest", requestSchema);
