const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['owner', 'finder', 'admin'],
      default: 'owner',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    currentLocation: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    profileImage: {
      url: String,
      cloudinaryId: String,
    },
    ratingAvg: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
    },
    stats: {
      requestsCreated: {
        type: Number,
        default: 0,
      },
      itemsFound: {
        type: Number,
        default: 0,
      },
      completedAssignments: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true, versionKey: false }
);


module.exports = mongoose.model('User', userSchema);
