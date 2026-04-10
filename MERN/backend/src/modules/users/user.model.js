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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isIdVerified: {
      type: Boolean,
      default: false,
    },
    isSelfieVerified: {
      type: Boolean,
      default: false,
    },
    verificationLevel: {
      type: String,
      enum: ['pending_verification', 'basic_verified', 'id_verified', 'advanced_verified'],
      default: 'pending_verification',
    },
    finderStatus: {
      type: String,
      enum: ['pending_verification', 'verified', 'flagged', 'restricted'],
      default: 'pending_verification',
    },
    trustScore: {
      type: Number,
      default: 0,
    },
    trustBadge: {
      type: String,
      enum: ['trusted_finder', 'basic_user', 'suspicious'],
      default: 'basic_user',
    },
    emailVerificationOtp: String,
    emailVerificationOtpExpiry: Date,
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
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
    activeSessions: [
      {
        sessionId: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          default: '',
        },
        ipAddress: {
          type: String,
          default: '',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastActiveAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notificationPreferences: {
      finderApplied: {
        type: Boolean,
        default: true,
      },
      trackingUpdate: {
        type: Boolean,
        default: true,
      },
      evidenceUpdate: {
        type: Boolean,
        default: true,
      },
      paymentUpdate: {
        type: Boolean,
        default: true,
      },
      disputeUpdate: {
        type: Boolean,
        default: true,
      },
      marketingAnnouncements: {
        type: Boolean,
        default: false,
      },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'limited', 'private'],
        default: 'limited',
      },
      activityHistoryVisible: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true, versionKey: false }
);


module.exports = mongoose.model('User', userSchema);
