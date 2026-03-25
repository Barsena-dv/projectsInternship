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
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
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
