const FinderAssignment = require('./assignment.model');
const AssignmentApplication = require('./assignmentApplication.model');
const LostItemRequest = require('../requests/request.model');
const User = require('../users/user.model');
const Payment = require('../payments/payment.model');
const { createNotification } = require('../notifications/notification.service');
const paymentService = require('../payments/payment.service');

/**
 * Finder applies for an open lost item request.
 */
const acceptAssignment = async (requestId, userId) => {
  // 1. Validate user role and verification status
  const user = await User.findById(userId);
  if (!user || user.role !== 'finder') {
    throw new Error('Only verified finders can accept assignments');
  }

  if (!user.isVerified) {
    throw new Error('Your account must be verified by an admin before accepting tasks');
  }

  // 2. Validate request status
  const request = await LostItemRequest.findById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.requestStatus !== 'open') {
    throw new Error('This request is no longer open for assignment');
  }

  // 3. Prevent self-assignment (Security check)
  if (request.owner.toString() === userId.toString()) {
    throw new Error('Owners cannot accept their own requests');
  }

  // 4. Ensure this request is still not assigned
  const activeAssignment = await FinderAssignment.findOne({ request: requestId, status: 'active' });
  if (activeAssignment) {
    throw new Error('This request has already been assigned by the owner');
  }

  // 5. Create/update pending application
  let application = await AssignmentApplication.findOne({ request: requestId, finder: userId });

  if (application?.status === 'pending') {
    throw new Error('You have already applied for this request. Waiting for owner approval.');
  }

  if (!application) {
    application = await AssignmentApplication.create({
      request: requestId,
      finder: userId,
      status: 'pending',
    });
  } else {
    application.status = 'pending';
    application.decisionReason = '';
    application.decidedAt = null;
    await application.save();
  }

  // Keep applicant reference without duplicates for owner visibility.
  await LostItemRequest.updateOne(
    { _id: requestId },
    { $addToSet: { finders: userId } }
  );

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: 'ASSIGNMENT_APPLY',
    entityType: 'AssignmentApplication',
    entityId: application._id,
    details: { requestId },
  });

  // 6. Notify owner of new application
  try {
    await createNotification({
      userId: request.owner,
      type: 'assignment',
      title: 'New Finder Application',
      message: `${user.full_name} wants to take your request: "${request.itemName}". Please accept or reject this application.`,
      data: {
        requestId: request._id,
        applicationId: application._id,
      },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return application.populate('request').populate('finder', 'full_name profileImage ratingAvg ratingCount');
};

/**
 * Owner can see all applications for a request.
 */
const getApplicationsByRequest = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized to view request applications');
  }

  return AssignmentApplication.find({ request: requestId })
    .populate('finder', 'full_name profileImage ratingAvg ratingCount isVerified')
    .sort({ createdAt: -1 });
};

/**
 * Owner accepts/rejects a finder application.
 */
const decideApplication = async (requestId, applicationId, decision, reason, userId) => {
  const normalizedDecision = String(decision || '').toLowerCase();
  if (!['accepted', 'rejected'].includes(normalizedDecision)) {
    throw new Error('Decision must be either accepted or rejected');
  }

  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized application decision attempt');
  }

  if (request.requestStatus !== 'open' && request.requestStatus !== 'assigned') {
    throw new Error(`Cannot process applications for request status: ${request.requestStatus}`);
  }

  const application = await AssignmentApplication.findOne({
    _id: applicationId,
    request: requestId,
  }).populate('finder', 'full_name');

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.status !== 'pending') {
    throw new Error('This application has already been decided');
  }

  if (normalizedDecision === 'rejected') {
    application.status = 'rejected';
    application.decisionReason = reason || 'Application rejected by owner';
    application.decidedAt = new Date();
    await application.save();

    try {
      await createNotification({
        userId: application.finder._id,
        type: 'assignment',
        title: 'Application Rejected',
        message: `Your application for "${request.itemName}" was rejected by the owner.${reason ? ` Reason: ${reason}` : ''}`,
        data: { requestId: request._id, applicationId: application._id },
      });
    } catch (err) {
      console.error('Notification failed:', err.message);
    }

    return { application, assignment: null };
  }

  const activeAssignment = await FinderAssignment.findOne({ request: requestId, status: 'active' });
  if (activeAssignment) {
    throw new Error('This request has already been assigned to another finder');
  }

  const assignment = await FinderAssignment.create({
    request: requestId,
    finder: application.finder._id,
    status: 'active',
  });

  application.status = 'accepted';
  application.decisionReason = reason || '';
  application.decidedAt = new Date();
  await application.save();

  // Reject all other pending applications since assignment is now locked.
  await AssignmentApplication.updateMany(
    {
      request: requestId,
      _id: { $ne: application._id },
      status: 'pending',
    },
    {
      $set: {
        status: 'rejected',
        decisionReason: 'Another finder was selected for this request',
        decidedAt: new Date(),
      },
    }
  );

  request.requestStatus = 'assigned';
  await request.save();

  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId,
    action: 'ASSIGNMENT_APPROVE',
    entityType: 'FinderAssignment',
    entityId: assignment._id,
    details: { requestId, applicationId: application._id },
  });

  try {
    await createNotification({
      userId: application.finder._id,
      type: 'assignment',
      title: 'Application Accepted',
      message: `Your application for "${request.itemName}" was accepted. Assignment is now active.`,
      data: { requestId: request._id, assignmentId: assignment._id, applicationId: application._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return {
    application,
    assignment: await FinderAssignment.findById(assignment._id)
      .populate('request')
      .populate('finder', 'full_name profileImage ratingAvg ratingCount'),
  };
};

/**
 * Get assignments for the logged-in finder
 */
const getMyAssignments = async (userId) => {
  return FinderAssignment.find({ finder: userId })
    .populate('request')
    .sort({ createdAt: -1 });
};

/**
 * Get assignment by Request ID (For Owners)
 */
const getAssignmentByRequest = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  // Only owner or admin can see who is assigned
  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to request assignment');
  }

  const assignment = await FinderAssignment.findOne({ request: requestId })
    .populate('finder', 'full_name profileImage ratingAvg ratingCount')
    .populate('request');

  if (!assignment) throw new Error('No active assignment found for this request');

  return assignment;
};

/**
 * Get a specific assignment by ID (Authenticated access)
 */
const getAssignmentById = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId)
    .populate({
      path: 'request',
      populate: { path: 'owner', select: 'full_name profileImage' },
    })
    .populate('finder', 'full_name profileImage ratingAvg');

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  // SECURITY: Only finder or owner can view
  const isFinder = assignment.finder._id.toString() === userId.toString();
  const isOwner = assignment.request.owner._id.toString() === userId.toString();

  if (!isFinder && !isOwner) {
    throw new Error('Unauthorized to view this assignment');
  }

  return assignment;
};

/**
 * Owner confirms item received from chat and ends assignment workflow.
 */
const completeAssignmentByOwner = async (assignmentId, userId, reason = '') => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the request owner can complete this assignment');
  }

  if (!assignment.chatUnlocked) {
    throw new Error('Chat is still locked. Complete evidence verification before confirming completion');
  }

  if (assignment.status === 'completed') {
    throw new Error('Assignment is already completed');
  }

  if (assignment.status === 'cancelled') {
    throw new Error('Cancelled assignments cannot be completed');
  }

  const payment = await Payment.findOne({
    request: assignment.request._id,
    owner: userId,
    paymentStatus: 'locked',
  }).sort({ createdAt: -1 });

  if (!payment) {
    throw new Error('No locked payment found for this assignment');
  }

  const releasedPayment = await paymentService.releasePayment(payment._id, userId, reason);

  const refreshedAssignment = await FinderAssignment.findById(assignment._id)
    .populate({
      path: 'request',
      populate: { path: 'owner', select: 'full_name profileImage' },
    })
    .populate('finder', 'full_name profileImage ratingAvg');

  return {
    assignment: refreshedAssignment,
    payment: releasedPayment,
  };
};

module.exports = {
  acceptAssignment,
  getApplicationsByRequest,
  decideApplication,
  getMyAssignments,
  getAssignmentByRequest,
  getAssignmentById,
  completeAssignmentByOwner,
};
