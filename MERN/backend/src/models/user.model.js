const mongoose = require('mongoose');

/**
 * User Schema
 * Represents the users of the PostNFind platform, including Owners, Finders, and Administrators.
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },
        role: {
            type: String,
            enum: {
                values: ['USER', 'FINDER', 'ADMIN'],
                message: '{VALUE} is not a valid role',
            },
            default: 'USER',
        },
        accountStatus: {
            type: String,
            enum: {
                values: ['PENDING', 'ACTIVE', 'SUSPENDED'],
                message: '{VALUE} is not a valid account status',
            },
            default: 'ACTIVE',
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerified: {
            type: Boolean,
            default: false,
        },
        // verificationStatus object (primarily for FINDER roles)
        verificationStatus: {
            isVerified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: {
                type: Date,
            },
            documents: [
                {
                    type: String, // URLs to verification documents
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
