const mongoose = require('mongoose');

/**
 * Evidence Schema
 * Represents proof uploaded by a Finder (e.g., photos, documents) to support their recovery claim.
 */
const evidenceSchema = new mongoose.Schema(
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
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
    },
    {
        timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' },
    }
);

// Helpful indexes for filtering evidence by request
evidenceSchema.index({ requestId: 1, uploadedAt: -1 });

const Evidence = mongoose.model('Evidence', evidenceSchema);

module.exports = Evidence;
