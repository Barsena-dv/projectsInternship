const mongoose = require('mongoose');

/**
 * Escrow Schema
 * Manages the financial state of a lost item recovery transaction.
 */
const escrowSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: [true, 'Request ID is required'],
            unique: true, // One escrow record per request
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Escrow amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        status: {
            type: String,
            enum: {
                values: ['LOCKED', 'RELEASED', 'REFUNDED'],
                message: '{VALUE} is not a valid escrow status',
            },
            default: 'LOCKED',
        },
        transactionReference: {
            type: String,
            required: [true, 'Transaction reference is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

escrowSchema.index({ status: 1 });

const Escrow = mongoose.model('Escrow', escrowSchema);

module.exports = Escrow;
