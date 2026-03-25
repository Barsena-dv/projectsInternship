const FinderAssignment = require('./assignment.model');
const AssignmentApplication = require('./assignmentApplication.model');
const LostItemRequest = require('../requests/request.model');
const User = require('../users/user.model');
const Payment = require('../payments/payment.model');
const { createNotification } = require('../notifications/notification.service');
const paymentService = require('../payments/payment.service');
const { addTimelineEvent, getTimelineByAssignment, getTimelineByRequest } = require('./assignmentTimeline.service');

const MAX_PAUSE_MS = 15 * 60 * 1000;

const buildDeadlineAt = (request) => {
  const explicitDeadline = request?.serviceDeadline ? new Date(request.serviceDeadline) : null;
  if (explicitDeadline && !Number.isNaN(explicitDeadline.getTime()) && explicitDeadline.getTime() > Date.now()) {
    return explicitDeadline;
  }

  const hours = request?.deadlineHours || 4;
  const fallback = new Date();
  fallback.setHours(fallback.getHours() + hours);
  return fallback;
};

/**
 * Finder applies for an open lost item request.
 */
const acceptAssignment = async (requestId, userId, payload = {}) => {
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
  const activeAssignment = await FinderAssignment.findOne({
    request: requestId,
    status: { $in: ['active', 'inactive', 'paused'] },
  });
  if (activeAssignment) {
    throw new Error('This request has already been assigned by the owner');
  }

  // 4. Create/update pending application
  let application = await AssignmentApplication.findOne({ request: requestId, finder: userId });

  if (application?.status === 'pending') {
    throw new Error('You have already applied for this request. Waiting for owner approval.');
  }

  const applyReason = String(payload.applyReason || '').trim();
  const finderRegion = String(payload.finderRegion || '').trim();

  if (!application) {
    application = await AssignmentApplication.create({
      request: requestId,
      finder: userId,
      status: 'pending',
      applyReason,
      finderRegion,
    });
  } else {
    application.status = 'pending';
    application.applyReason = applyReason;
    application.finderRegion = finderRegion;
    application.decisionReason = '';
    application.decidedAt = null;
    await application.save();
  }

  await addTimelineEvent({
    requestId: request._id,
    action: 'APPLICATION_SUBMITTED',
    actorUserId: userId,
    actorRole: 'finder',
    actorLabel: 'Finder',
    details: { requestId: request._id, applyReason, finderRegion },
  });

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: 'ASSIGNMENT_APPLY',
    entityType: 'AssignmentApplication',
    entityId: application._id,
    details: { requestId },
  });

  // Keep applicant reference without duplicates for owner visibility.
  await LostItemRequest.updateOne(
    { _id: requestId },
    { $addToSet: { finders: userId } }
  );

  // Audit Log (This was moved inside the try block for assignment creation)
  // const { logAction } = require('../auditLogs/auditLog.service');
  // logAction({
  //   userId: userId,
  //   action: 'ASSIGNMENT_APPLY',
  //   entityType: 'AssignmentApplication',
  //   entityId: application._id,
  //   details: { requestId },
  // });

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

const getMyApplications = async (finderId) => {
  return AssignmentApplication.find({ finder: finderId })
    .populate({
      path: 'request',
      populate: [
        { path: 'owner', select: 'full_name profileImage ratingAvg' },
        { path: 'planId', select: 'planName rewardAmount searchDuration' },
      ],
    })
    .sort({ createdAt: -1 });
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

  const rows = await AssignmentApplication.find({ request: requestId })
    .populate('finder', 'full_name profileImage ratingAvg ratingCount isVerified phone email stats')
    .sort({ createdAt: -1 });

  const finderIds = rows
    .map((row) => row?.finder?._id)
    .filter(Boolean);

  const uniqueFinderIds = [...new Set(finderIds.map((id) => String(id)))];

  const allAssignments = await FinderAssignment.find({
    finder: { $in: uniqueFinderIds },
  }).select('finder status');

  const statsByFinder = allAssignments.reduce((acc, row) => {
    const key = String(row.finder);
    if (!acc[key]) {
      acc[key] = { total: 0, completed: 0, failed: 0 };
    }

    acc[key].total += 1;
    if (row.status === 'completed') acc[key].completed += 1;
    if (['expired', 'cancelled'].includes(row.status)) acc[key].failed += 1;
    return acc;
  }, {});

  return rows.map((row) => {
    const key = String(row?.finder?._id || '');
    const stat = statsByFinder[key] || { total: 0, completed: 0, failed: 0 };
    const completionRate = stat.total ? Math.round((stat.completed / stat.total) * 100) : 0;
    const failureRate = stat.total ? Math.round((stat.failed / stat.total) * 100) : 0;

    return {
      ...row.toObject(),
      finderStats: {
        totalAssignments: stat.total,
        completedAssignments: stat.completed,
        failedAssignments: stat.failed,
        completionRate,
        failureRate,
      },
    };
  });
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

    await addTimelineEvent({
      requestId: request._id,
      action: 'APPLICATION_REJECTED',
      actorUserId: userId,
      actorRole: 'owner',
      actorLabel: 'Owner',
      details: { reason: application.decisionReason || '' },
    });

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

  const activeAssignment = await FinderAssignment.findOne({
    request: requestId,
    status: { $in: ['active', 'inactive', 'paused'] },
  });
  if (activeAssignment) {
    throw new Error('This request has already been assigned to another finder');
  }

  const assignment = await FinderAssignment.create({
    request: requestId,
    finder: application.finder._id,
    status: 'active',
    deadlineAt: buildDeadlineAt(request),
    lastActivityAt: new Date(),
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

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: request._id,
    action: 'ASSIGNMENT_ACCEPTED',
    actorUserId: userId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: {
      finderId: application.finder._id,
      deadlineAt: assignment.deadlineAt,
    },
  });

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

  const assignment = await FinderAssignment.findOne({ request: requestId });

  if (!assignment) throw new Error('No active assignment found for this request');

  // Sync status before returning to owner
  await syncAssignmentStatus(assignment._id);

  return FinderAssignment.findById(assignment._id)
    .populate('finder', 'full_name profileImage ratingAvg ratingCount')
    .populate('request');
};

/**
 * Passive status sync: Checks for expiration and inactivity
 */
const syncAssignmentStatus = async (assignmentId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment || ['completed', 'cancelled', 'expired'].includes(assignment.status)) {
    return assignment;
  }

  const now = new Date();
  let changed = false;

  // 1. Check Deadline Expiration
  if (assignment.status !== 'expired' && assignment.deadlineAt && now > assignment.deadlineAt) {
    assignment.status = 'expired';
    changed = true;

    await addTimelineEvent({
      assignmentId: assignment._id,
      requestId: assignment.request._id,
      action: 'ASSIGNMENT_EXPIRED',
      details: { deadlineAt: assignment.deadlineAt },
    });

    // Notify both
    try {
      await createNotification({
        userId: assignment.finder,
        type: 'deadline',
        title: 'Assignment Expired',
        message: `Your deadline for "${assignment.request.itemName}" has passed.`,
        data: { assignmentId: assignment._id },
      });
      await createNotification({
        userId: assignment.request.owner,
        type: 'deadline',
        title: 'Assignment Expired',
        message: `The finder's deadline for "${assignment.request.itemName}" has passed without completion.`,
        data: { assignmentId: assignment._id },
      });
    } catch (nErr) { console.error('Notification failed:', nErr.message); }
  }

  // 2. Check Inactivity (Only if still active)
  if (!changed && assignment.status === 'active') {
    const inactivityThreshold = 60 * 60 * 1000; // 1 hour
    const lastActivity = assignment.lastActivityAt || assignment.assignedAt;
    
    if (now - lastActivity > inactivityThreshold) {
      assignment.status = 'inactive';
      assignment.inactivityMarkedAt = now;
      changed = true;

      await addTimelineEvent({
        assignmentId: assignment._id,
        requestId: assignment.request._id,
        action: 'ASSIGNMENT_INACTIVE',
        details: { lastActivityAt: lastActivity },
      });

      // Notify owner
      try {
        await createNotification({
          userId: assignment.request.owner,
          type: 'inactivity',
          title: 'Finder Inactive',
          message: `The finder seems inactive on your request: "${assignment.request.itemName}". No updates for over 1 hour.`,
          data: { assignmentId: assignment._id },
        });
      } catch (nErr) { console.error('Notification failed:', nErr.message); }
    }
  }

  if (changed) {
    await assignment.save();
  }

  return assignment;
};

/**
 * Get a specific assignment by ID (Authenticated access)
 */
const getAssignmentById = async (assignmentId, userId) => {
  // Sync status before returning
  await syncAssignmentStatus(assignmentId);

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

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: assignment.request._id,
    action: 'ASSIGNMENT_COMPLETED',
    actorUserId: userId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: { reason: reason || '' },
  });

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

const retryExpiredAssignment = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized retry attempt');
  }

  const latestStop = await FinderAssignment.findOne({
    request: requestId,
    status: { $in: ['expired', 'cancelled'] },
  }).sort({ updatedAt: -1 });

  if (!latestStop) {
    throw new Error('No expired or cancelled assignment found to retry');
  }

  if (latestStop.status === 'expired') {
    latestStop.status = 'cancelled';
    await latestStop.save();
  }

  request.requestStatus = 'open';
  await request.save();

  await addTimelineEvent({
    assignmentId: latestStop._id,
    requestId,
    action: 'ASSIGNMENT_RETRIED',
    actorUserId: userId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: {},
  });

  return request;
};

const getAssignmentTimelineByAssignment = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const isFinder = assignment.finder.toString() === userId.toString();
  const isOwner = assignment.request.owner.toString() === userId.toString();

  if (!isFinder && !isOwner) {
    throw new Error('Unauthorized to view assignment timeline');
  }

  return getTimelineByAssignment(assignmentId);
};

const getAssignmentTimelineByRequest = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized to view request timeline');
  }

  return getTimelineByRequest(requestId);
};

const pauseAssignment = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  if (assignment.finder.toString() !== userId.toString()) {
    throw new Error('Only the assigned finder can pause the assignment');
  }

  if (assignment.status !== 'active' && assignment.status !== 'inactive') {
    throw new Error(`Cannot pause an assignment in ${assignment.status} state`);
  }

  assignment.status = 'paused';
  assignment.pausedAt = new Date();
  await assignment.save();

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: assignment.request._id,
    action: 'ASSIGNMENT_PAUSED',
    actorUserId: userId,
    actorRole: 'finder',
    actorLabel: 'Finder',
    details: { pausedAt: assignment.pausedAt },
  });

  try {
    await createNotification({
      userId: assignment.request.owner,
      type: 'assignment',
      title: 'Assignment Paused',
      message: `The finder has paused the search for "${assignment.request.itemName}". They will resume soon.`,
      data: { assignmentId: assignment._id },
    });
  } catch (nErr) { console.error('Notification failed:', nErr.message); }

  return assignment;
};

const resumeAssignment = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  if (assignment.finder.toString() !== userId.toString()) {
    throw new Error('Only the assigned finder can resume the assignment');
  }

  if (assignment.status !== 'paused') {
    throw new Error('Assignment is not paused');
  }

  const now = new Date();
  const pausedAt = assignment.pausedAt ? new Date(assignment.pausedAt).getTime() : Date.now();
  const elapsed = Math.max(Date.now() - pausedAt, 0);
  const extensionMs = Math.min(elapsed, MAX_PAUSE_MS);

  if (assignment.deadlineAt) {
    const currentDeadline = new Date(assignment.deadlineAt).getTime();
    assignment.deadlineAt = new Date(currentDeadline + extensionMs);
  }

  assignment.status = 'active';
  assignment.lastActivityAt = now;
  assignment.pausedAt = null;
  await assignment.save();

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: assignment.request._id,
    action: 'ASSIGNMENT_RESUMED',
    actorUserId: userId,
    actorRole: 'finder',
    actorLabel: 'Finder',
    details: {
      resumedAt: now,
      pauseExtensionMs: extensionMs,
      pauseExtensionMinutes: Math.round(extensionMs / 60000),
    },
  });

  try {
    await createNotification({
      userId: assignment.request.owner,
      type: 'assignment',
      title: 'Assignment Resumed',
      message: `Great news! The finder has resumed searching for "${assignment.request.itemName}".`,
      data: { assignmentId: assignment._id },
    });
  } catch (nErr) { console.error('Notification failed:', nErr.message); }

  return assignment;
};

module.exports = {
  acceptAssignment,
  getMyApplications,
  getApplicationsByRequest,
  decideApplication,
  getMyAssignments,
  getAssignmentByRequest,
  getAssignmentById,
  getAssignmentTimelineByAssignment,
  getAssignmentTimelineByRequest,
  completeAssignmentByOwner,
  retryExpiredAssignment,
  pauseAssignment,
  resumeAssignment,
};
