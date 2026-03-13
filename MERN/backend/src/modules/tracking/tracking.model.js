const mongoose = require("mongoose");

const trackingSchema = new mongoose.Schema(
    {
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
        statusUpdate: {
            type: String,
            enum: ["searching", "near_location", "item_found", "search_failed"],
            required: true,
        },
        currentLocation: {
            type: String,
            required: true,
        },
        currentLat: {
            type: Number,
            required: true,
        },
        currentLng: {
            type: Number,
            required: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("TrackingUpdate", trackingSchema);
