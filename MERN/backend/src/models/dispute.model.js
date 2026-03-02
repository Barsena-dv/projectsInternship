const mongoose = require('mongoose');

/**
 * Dispute Schema
 * Handles conflicts between the Owner and the Finder regarding a recovery request.
 */
const disputeSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: [true, 'Request ID is required'],
            index: true,
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID of the person raising the dispute is required'],
            index: true,
        },
        reason: {
            type: String,
            required: [true, 'Dispute reason is required'],
            trim: true,
            minlength: [10, 'Reason must be at least 10 characters long'],
        },
        status: {
            type: String,
            enum: {
                values: ['OPEN', 'RESOLVED'],
                message: '{VALUE} is not a valid dispute status',
            },
            default: 'OPEN',
        },
        adminNotes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

disputeSchema.index({ status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
