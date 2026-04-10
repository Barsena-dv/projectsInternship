const mongoose = require('mongoose');

const evidenceFileSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: [
      {
        url: String,
        cloudinaryId: String,
        fileType: {
          type: String,
          enum: ['image', 'video', 'document'],
        },
      },
    ],
    description: String,
    lat: Number,
    lng: Number,
    hiddenData: {
      uniqueIdentifyingMarks: {
        type: String,
        default: '',
      },
      exactPickupLocation: {
        type: String,
        default: '',
      },
      privateNotes: {
        type: String,
        default: '',
      },
      foundAt: Date,
      foundLocationText: {
        type: String,
        default: '',
      },
    },
    claimVerification: {
      ownerAnswers: {
        identifyingMarks: {
          type: String,
          default: '',
        },
        contents: {
          type: String,
          default: '',
        },
        proofReference: {
          type: String,
          default: '',
        },
      },
      matchScore: {
        type: Number,
        default: 0,
      },
      matchOutcome: {
        type: String,
        enum: ['match', 'partial', 'mismatch', 'not_checked'],
        default: 'not_checked',
      },
      checkedAt: Date,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'needs_admin_review'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationNotes: String,
    verificationDate: Date,
  },
  { timestamps: true, versionKey: false }
);

evidenceFileSchema.index({ assignment: 1 });
evidenceFileSchema.index({ finder: 1, verificationStatus: 1 });

module.exports = mongoose.model('EvidenceFile', evidenceFileSchema);
