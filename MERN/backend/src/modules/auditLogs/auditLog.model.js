const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['User', 'LostItemRequest', 'FinderAssignment', 'AssignmentApplication', 'EvidenceFile', 'Payment', 'Dispute', 'Payout', 'Notification', 'AdminSystemSetting'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
  },
  { timestamps: true, versionKey: false }
);

auditLogSchema.index({ user: 1, action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
