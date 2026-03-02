const mongoose = require('mongoose');

/**
 * Request Schema
 * Represents a lost item recovery request posted by an Owner.
 */
const requestSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner ID is required'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Request title is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        generalLocation: {
            type: String,
            required: [true, 'General location is required'],
            trim: true,
        },
        exactLocation: {
            type: String,
            required: [true, 'Exact location is required (visible to finder after assignment)'],
            trim: true,
            select: false, // Hidden by default, manually selected in controllers when needed
        },
        rewardAmount: {
            type: Number,
            required: [true, 'Reward amount is required'],
            min: [0, 'Reward amount cannot be negative'],
        },
        status: {
            type: String,
            enum: {
                values: [
                    'DRAFT',
                    'OPEN',
                    'ASSIGNED',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'DISPUTED',
                    'REFUNDED',
                ],
                message: '{VALUE} is not a valid status',
            },
            default: 'DRAFT',
        },
        selectedFinderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
requestSchema.index({ status: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({ createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
