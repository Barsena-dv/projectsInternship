const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItemRequest',
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinderAssignment',
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratingValue: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Ensure one rating per assignment/request
ratingSchema.index({ assignment: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
