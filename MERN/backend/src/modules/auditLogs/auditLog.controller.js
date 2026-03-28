const auditLogService = require('./auditLog.service');

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, user, page, limit } = req.query;
    
    const filters = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (user) filters.user = user;

    const result = await auditLogService.getLogs(filters, parseInt(page) || 1, parseInt(limit) || 50);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyActivity = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filters = { userId: req.user.userId };

    const result = await auditLogService.getLogs(filters, parseInt(page) || 1, parseInt(limit) || 20);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAuditLogs,
  getMyActivity,
};
