const disputeService = require('./dispute.service');

const createDispute = async (req, res) => {
  try {
    const { assignmentId, reason, evidence } = req.body;
    const userId = req.user.userId;

    if (!assignmentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and reason are required',
      });
    }

    const dispute = await disputeService.createDispute(assignmentId, userId, reason, evidence);

    res.status(201).json({
      success: true,
      message: 'Dispute raised successfully. Assignment and payment are now locked.',
      data: dispute,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getDispute = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const dispute = await disputeService.getDisputeByAssignment(assignmentId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'No dispute found for this assignment',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dispute retrieved successfully',
      data: dispute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolutionDetails, adminDecision } = req.body;
    const adminId = req.user.userId;

    if (!resolutionDetails || !adminDecision) {
      return res.status(400).json({
        success: false,
        message: 'Resolution details and adminDecision are required',
      });
    }

    const dispute = await disputeService.resolveDispute(
      disputeId,
      adminDecision,
      resolutionDetails,
      adminId
    );

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: dispute,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDispute,
  getDispute,
  resolveDispute,
};
