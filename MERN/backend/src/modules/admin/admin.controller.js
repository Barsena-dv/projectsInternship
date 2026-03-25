const adminService = require('./admin.service');

const verifyFinder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved, reason } = req.body;
    const user = await adminService.verifyFinder(userId, isApproved, req.user.userId, reason);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const user = await adminService.updateUserStatus(userId, status, req.user.userId, reason);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDisputes = async (req, res) => {
  try {
    const disputes = await adminService.listDisputes(req.query);
    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { adminDecision, resolutionDetails, penalizeFinder, penalizeOwner } = req.body;
    const adminId = req.user.userId;

    const dispute = await adminService.resolveDispute(
      disputeId,
      adminDecision,
      resolutionDetails,
      adminId,
      { penalizeFinder, penalizeOwner }
    );

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const result = await adminService.listUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await adminService.getUserProfile(userId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listRequests = async (req, res) => {
  try {
    const result = await adminService.listRequests(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await adminService.getRequestDetails(requestId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const result = await adminService.deleteRequest(requestId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forceCloseRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const result = await adminService.forceCloseRequest(requestId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const reopenRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const result = await adminService.reopenRequest(requestId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listAssignments = async (req, res) => {
  try {
    const result = await adminService.listAssignments(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await adminService.getAssignmentDetails(assignmentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, reason } = req.body;
    const result = await adminService.updateAssignmentStatus(assignmentId, status, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const extendAssignmentDeadline = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { extensionMinutes, reason } = req.body;
    const result = await adminService.extendAssignmentDeadline(
      assignmentId,
      extensionMinutes,
      req.user.userId,
      reason
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTrackingAnalytics = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await adminService.getTrackingAnalytics(assignmentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDisputeDetails = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const result = await adminService.getDisputeDetails(disputeId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listPayments = async (req, res) => {
  try {
    const result = await adminService.listPayments(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await adminService.getPaymentDetails(paymentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forceReleasePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const result = await adminService.forceReleasePayment(paymentId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const result = await adminService.refundPaymentByAdmin(paymentId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const flagSuspiciousPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const result = await adminService.flagSuspiciousPayment(paymentId, req.user.userId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await adminService.getAuditLogsForAdmin(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const result = await adminService.getNotificationMonitoring(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFraudSignals = async (req, res) => {
  try {
    const result = await adminService.getFraudSignals(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const result = await adminService.getSystemSettings();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const result = await adminService.updateSystemSettings(req.body, req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyFinder,
  updateUserStatus,
  getDashboardStats,
  listUsers,
  getUserProfile,
  listRequests,
  getRequestDetails,
  deleteRequest,
  forceCloseRequest,
  reopenRequest,
  listAssignments,
  getAssignmentDetails,
  updateAssignmentStatus,
  extendAssignmentDeadline,
  getTrackingAnalytics,
  getAllDisputes,
  getDisputeDetails,
  resolveDispute,
  listPayments,
  getPaymentDetails,
  forceReleasePayment,
  refundPayment,
  flagSuspiciousPayment,
  getAuditLogs,
  getNotifications,
  getFraudSignals,
  getSystemSettings,
  updateSystemSettings,
};
