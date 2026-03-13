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
            default: "owner",
            required: true,
        },
        profileImage: {
            type: String,
            default: null,
        },
        ratingAvg: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended", "blocked", "deleted"],
            default: "active",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// --- Export ---
module.exports = mongoose.model("User", userSchema);
