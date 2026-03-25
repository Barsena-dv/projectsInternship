const adminService = require('./admin.service');
const disputeService = require('../disputes/dispute.service');

const verifyFinder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved } = req.body;
    const user = await adminService.verifyFinder(userId, isApproved);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const user = await adminService.updateUserStatus(userId, status);
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
    const { status } = req.query;
    const disputes = await adminService.getAllDisputes(status);
    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { adminDecision, resolutionDetails } = req.body;
    const adminId = req.user.userId;

    const dispute = await disputeService.resolveDispute(
      disputeId,
      adminDecision,
      resolutionDetails,
      adminId
    );

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyFinder,
  updateUserStatus,
  getDashboardStats,
  getAllDisputes,
  resolveDispute,
};
