const assignmentService = require('./assignment.service');

const acceptAssignment = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.userId;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const assignment = await assignmentService.acceptAssignment(requestId, userId);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Waiting for owner approval.',
      data: assignment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const assignments = await assignmentService.getMyAssignments(userId);

    res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRequestApplications = async (req, res) => {
  try {
    const { requestId } = req.params;
    const applications = await assignmentService.getApplicationsByRequest(requestId, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: applications,
    });
  } catch (error) {
    const isUnauthorized = String(error.message || '').toLowerCase().includes('unauthorized');
    const statusCode = isUnauthorized ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const decideApplication = async (req, res) => {
  try {
    const { requestId, applicationId } = req.params;
    const { decision, reason } = req.body;

    const result = await assignmentService.decideApplication(
      requestId,
      applicationId,
      decision,
      reason,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: `Application ${decision} successfully`,
      data: result,
    });
  } catch (error) {
    const message = String(error.message || 'Failed to process application');
    const isAuthError = message.includes('Unauthorized');
    const isNotFound = message.includes('not found');
    const statusCode = isAuthError ? 403 : isNotFound ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

const getAssignmentByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const assignment = await assignmentService.getAssignmentByRequest(requestId, req.user.userId);

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error.message === 'No active assignment found for this request') {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No assignment yet for this request',
      });
    }

    if (error.message === 'Request not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Unauthorized access to request assignment') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Assignment details retrieved',
      data: assignment,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

const completeAssignmentByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const result = await assignmentService.completeAssignmentByOwner(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Assignment completed and payment released',
      data: result,
    });
  } catch (error) {
    const message = String(error.message || 'Failed to complete assignment');
    const isAuthError = message.includes('Unauthorized');
    const isNotFound = message.includes('not found');
    const statusCode = isAuthError ? 403 : isNotFound ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  acceptAssignment,
  getRequestApplications,
  decideApplication,
  getMyAssignments,
  getAssignmentByRequest,
  getAssignmentById,
  completeAssignmentByOwner,
};
