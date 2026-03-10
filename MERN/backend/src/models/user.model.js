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

// --- Instance Methods ---

// userSchema.methods.updateProfile = async function (updates = {}) {
//     const allowedUpdates = ["fullName", "phone"];
//     allowedUpdates.forEach((field) => {
//         if (updates[field] !== undefined) {
//             this[field] = updates[field];
//         }
//     });
//     return this.save();
// };

// userSchema.methods.updateProfileImage = async function (imagePath) {
//     this.profile_image = imagePath;
//     return this.save();
// };

// userSchema.methods.updateRating = async function (newRating) {
//     // Update running average
//     const currentTotal = this.rating_avg * this.rating_count;
//     this.rating_count += 1;
//     this.rating_avg = (currentTotal + newRating) / this.rating_count;

//     return this.save();
// };

// // --- Static Methods ---

// userSchema.statics.findUserByEmail = function (email) {
//     return this.findOne({ email: email.toLowerCase() });
// };

// userSchema.statics.findUserById = function (userId) {
//     return this.findById(userId);
// };

// --- Export ---

module.exports = mongoose.model("User", userSchema);
