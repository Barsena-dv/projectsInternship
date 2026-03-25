const AuditLog = require('./auditLog.model');

/**
 * Log a system action (Non-blocking)
 */
const logAction = async ({ userId, action, entityType, entityId, details, ipAddress }) => {
  try {
    // We don't await this if we want it to be truly non-blocking in the calling service,
    // but usually in Node/Mongoose, simple create is fast enough.
    // If performance is ultra-critical, we could use a queue or not await.
    await AuditLog.create({
      user: userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Fail silently to not break the main flow
    console.error('Audit Logging Error:', error.message);
  }
};

/**
 * Get logs for admin viewing
 */
const getLogs = async (filters = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  
  const logs = await AuditLog.find(filters)
    .populate('user', 'full_name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(filters);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  logAction,
  getLogs,
};
