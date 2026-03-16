const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["owner", "finder", "admin"],
            required: true,
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended", "banned"],
            default: "active",
        },
        profileImage: {
            type: String,
            default: null,
        },
        ratingAvg: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        walletBalance: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Indexes ---
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
