const mongoose = require('mongoose');

/**
 * Application Schema
 * Represents a Finder applying for a Lost Item Request.
 */
const applicationSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: [true, 'Request ID is required'],
            index: true,
        },
        finderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Finder ID is required'],
            index: true,
        },
        message: {
            type: String,
            required: [true, 'Application message is required'],
            trim: true,
            maxlength: [500, 'Application message cannot exceed 500 characters'],
        },
        status: {
            type: String,
            enum: {
                values: ['APPLIED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
                message: '{VALUE} is not a valid application status',
            },
            default: 'APPLIED',
        },
    },
    {
        timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' },
    }
);

// Unique index to prevent multiple applications for the same request by the same finder
applicationSchema.index({ requestId: 1, finderId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
