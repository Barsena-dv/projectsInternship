const FinderAssignment = require('./assignment.model');
const AssignmentApplication = require('./assignmentApplication.model');
const LostItemRequest = require('../requests/request.model');
const User = require('../users/user.model');
const Payment = require('../payments/payment.model');
const ServicePlan = require('../servicePlans/servicePlan.model');
const Payout = require('../payouts/payout.model');
const { createNotification } = require('../notifications/notification.service');
const paymentService = require('../payments/payment.service');
const payoutService = require('../payouts/payout.service');
const { addTimelineEvent, getTimelineByAssignment, getTimelineByRequest } = require('./assignmentTimeline.service');

const MAX_PAUSE_MS = 15 * 60 * 1000;
const ASSIGNMENT_DEADLINE_HOURS = Number(process.env.ASSIGNMENT_DEADLINE_HOURS || 4);
const EXPIRED_DROP_FINDER_FEE_PERCENT = Number(process.env.EXPIRED_DROP_FINDER_FEE_PERCENT || 10);

const round2 = (value) => Number(Number(value || 0).toFixed(2));

const buildDeadlineAt = () => {
  const hours = Number.isFinite(ASSIGNMENT_DEADLINE_HOURS) && ASSIGNMENT_DEADLINE_HOURS > 0
    ? ASSIGNMENT_DEADLINE_HOURS
    : 4;
  const fallback = new Date();
  fallback.setHours(fallback.getHours() + hours);
  return fallback;
};

const isOwnerDeadlinePassed = (serviceDeadline) => {
  if (!serviceDeadline) return false;
  const ms = new Date(serviceDeadline).getTime();
  return Number.isFinite(ms) && ms <= Date.now();
};

const getLatestStoppedAssignment = async (requestId) => FinderAssignment.findOne({
  request: requestId,
  status: { $in: ['expired', 'failed', 'cancelled'] },
}).sort({ updatedAt: -1 });

const getLockedPaymentForRequest = async (requestId, ownerId) => {
  const payment = await Payment.findOne({
    request: requestId,
    owner: ownerId,
    paymentStatus: 'locked',
  })
    .sort({ createdAt: -1 })
    .populate('servicePlan');

  if (!payment) return null;

  if (!payment.servicePlan) {
    payment.servicePlan = await ServicePlan.findById(payment.servicePlan);
  }

  return payment;
};

const calculateSettlementAmounts = (payment, kind) => {
  const amount = Number(payment?.amount || 0);
  
  // Resolve plan even if nested or just an ID (though usually it should be populated here)
  const plan = payment?.servicePlan;
  const planRefundPercent = Number(plan?.refundPercent || 70);
  const planFinderPercent = Number(plan?.finderPercent || 15);
  const planPlatformPercent = Number(plan?.platformPercent || 15);

  // Success Scenario: Finder gets (Guaranteed Search Fee + Success Bonus)
  const successRewardAmount = round2((amount * (planFinderPercent + planRefundPercent)) / 100);

  // Failure Scenario: Owner gets refund (Success Bonus portion)
  const ownerRefundAmount = round2((amount * planRefundPercent) / 100);

  // Failure Scenario: Finder gets guaranteed portion only
  const finderCompensationAmount = round2((amount * planFinderPercent) / 100);

  return {
    ownerRefundAmount,
    finderCompensationAmount,
    successRewardAmount,
    planRefundPercent,
    planFinderPercent,
    planPlatformPercent,
  };
};

const applySettlement = async ({ payment, assignment, reason, kind, requestId, actorUserId }) => {
  const { ownerRefundAmount, finderCompensationAmount, planRefundPercent, planFinderPercent } = calculateSettlementAmounts(payment, kind);

  payment.paymentStatus = 'refunded';
  payment.refundStatus = 'completed';
  payment.refundAmount = ownerRefundAmount;
  payment.finderCompensationAmount = finderCompensationAmount;
  payment.refundReason = reason;
  payment.settlementType = kind;
  payment.settlementReason = reason;
  await payment.save();

  if (finderCompensationAmount > 0) {
    const existingPayout = await Payout.findOne({ payment: payment._id });
    if (!existingPayout) {
      await payoutService.createPayout(payment._id, assignment._id, assignment.finder, finderCompensationAmount, {
        payoutCategory: 'compensation',
        payoutStatus: 'processed',
        settlementReason: reason,
        remarks: kind === 'failed_drop'
          ? 'Failed drop settlement compensation'
          : 'Expired drop goodwill compensation',
      });
    } else {
      // Update existing pending payout to processed compensation
      existingPayout.payoutAmount = finderCompensationAmount;
      existingPayout.payoutStatus = 'processed';
      existingPayout.payoutCategory = 'compensation';
      existingPayout.settlementReason = reason;
      existingPayout.processedAt = new Date();
      existingPayout.transactionId = 'SYSTEM_AUTO_SETTLEMENT';
      existingPayout.remarks = kind === 'failed_drop' ? 'Failed drop settlement' : 'Expired drop settlement';
      await existingPayout.save();
    }
  }

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId,
    action: kind === 'failed_drop' ? 'REQUEST_DROPPED_AFTER_FAILED' : kind === 'failed_retry_refund' ? 'REQUEST_RETRY_DIFFERENT_FINDER' : 'REQUEST_DROPPED_AFTER_EXPIRED',
    actorUserId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: {
      settlementType: kind,
      reason,
      ownerRefundAmount,
      finderCompensationAmount,
      refundPercent: planRefundPercent,
      finderPercent: planFinderPercent,
    },
  });

  return {
    payment,
    ownerRefundAmount,
    finderCompensationAmount,
  };
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

    await createNotification({
      userId,
      type: 'assignment',
      title: 'Application Submitted',
      message: `Your application for "${request.itemName}" is submitted and waiting for owner decision.`,
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
    if (['expired', 'cancelled', 'failed'].includes(row.status)) acc[key].failed += 1;
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
    deadlineAt: buildDeadlineAt(),
    lastActivityAt: new Date(),
  });

  application.status = 'accepted';
  application.decisionReason = reason || '';
  application.decidedAt = new Date();
  await application.save();

  const pendingOthers = await AssignmentApplication.find(
    {
      request: requestId,
      _id: { $ne: application._id },
      status: 'pending',
    },
    { _id: 1, finder: 1 }
  );

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

  // NEW: Create Payout Record (Initial Pending State for Visibility)
  try {
    const payment = await getLockedPaymentForRequest(request._id, userId);
    if (payment && payment.servicePlan) {
      const plan = payment.servicePlan;
      const finderPercent = Number(plan.finderPercent || 15);
      const guaranteedAmount = round2((payment.amount * finderPercent) / 100);
      
      await payoutService.createPayout(
        payment._id,
        assignment._id,
        application.finder._id,
        guaranteedAmount,
        { 
          payoutStatus: 'pending',
          payoutCategory: 'standard',
          remarks: 'Guaranteed search fee locked'
        }
      );
    }
  } catch (pErr) {
    console.error('Initial payout creation failed:', pErr.message);
  }

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

    await createNotification({
      userId,
      type: 'assignment',
      title: 'Finder Assigned',
      message: `You accepted ${application.finder.full_name} for "${request.itemName}".`,
      data: { requestId: request._id, assignmentId: assignment._id, applicationId: application._id },
    });

    if (pendingOthers.length) {
      await Promise.all(
        pendingOthers.map((row) => createNotification({
          userId: row.finder,
          type: 'assignment',
          title: 'Application Closed',
          message: `Another finder was selected for "${request.itemName}".`,
          data: { requestId: request._id, applicationId: row._id },
        }))
      );
    }
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
    .populate({
      path: 'request',
      populate: { path: 'planId' },
    })
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
  if (!assignment || ['completed', 'cancelled', 'expired', 'failed'].includes(assignment.status)) {
    return assignment;
  }

  const now = new Date();
  let changed = false;

  // 1. Check Finder assignment deadline (4h window)
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
        title: 'Finder Assignment Expired',
        message: `Your 4-hour assignment deadline for "${assignment.request.itemName}" has passed.`,
        data: { assignmentId: assignment._id },
      });
      await createNotification({
        userId: assignment.request.owner,
        type: 'deadline',
        title: 'Finder Assignment Expired',
        message: `Finder assignment deadline for "${assignment.request.itemName}" has passed without completion.`,
        data: { assignmentId: assignment._id },
      });
    } catch (nErr) { console.error('Notification failed:', nErr.message); }
  }

  // 2. Check owner service deadline (independent hard stop)
  if (!changed && assignment.request && isOwnerDeadlinePassed(assignment.request.serviceDeadline)) {
    assignment.status = 'failed';
    changed = true;

    assignment.request.requestStatus = 'failed';
    await assignment.request.save();

    await addTimelineEvent({
      assignmentId: assignment._id,
      requestId: assignment.request._id,
      action: 'REQUEST_SERVICE_DEADLINE_FAILED',
      details: { serviceDeadline: assignment.request.serviceDeadline },
    });

    try {
      await createNotification({
        userId: assignment.finder,
        type: 'deadline',
        title: 'Request Failed (Owner Deadline)',
        message: `Owner service deadline for "${assignment.request.itemName}" has ended. Assignment is marked failed.`,
        data: { assignmentId: assignment._id, requestId: assignment.request._id },
      });
      await createNotification({
        userId: assignment.request.owner,
        type: 'deadline',
        title: 'Request Failed (Owner Deadline)',
        message: `Your service deadline for "${assignment.request.itemName}" has ended. Request and assignment are now failed.`,
        data: { assignmentId: assignment._id, requestId: assignment.request._id },
      });
    } catch (nErr) {
      console.error('Notification failed:', nErr.message);
    }
  }

  // 3. Check Inactivity (Only if still active)
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

        await createNotification({
          userId: assignment.finder,
          type: 'inactivity',
          title: 'You Are Marked Inactive',
          message: `No updates were posted for over 1 hour on "${assignment.request.itemName}". Add tracking updates to reactivate.`,
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

  // Increment Finder stats in User model
  await User.findByIdAndUpdate(assignment.finder, {
    $inc: { 
      'stats.completedAssignments': 1,
      'stats.itemsFound': 1
    }
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
  const latestStop = await getLatestStoppedAssignment(requestId);
  if (!latestStop) throw new Error('No expired or failed assignment found to retry');

  if (String(latestStop.status) !== 'failed') {
    throw new Error('Expired assignments can only be retried with same finder or dropped by owner');
  }

  const result = await retryFailedWithDifferentFinder(requestId, userId, 'Owner requested different finder after failed state');
  return result.request;
};

const retryExpiredWithSameFinder = async (requestId, userId, reason = '') => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');
  if (request.owner.toString() !== userId.toString()) throw new Error('Unauthorized retry attempt');

  const latestStop = await getLatestStoppedAssignment(requestId);
  if (!latestStop || String(latestStop.status) !== 'expired') {
    throw new Error('Only expired assignments can be retried with same finder');
  }

  latestStop.status = 'active';
  latestStop.deadlineAt = buildDeadlineAt();
  latestStop.pausedAt = null;
  latestStop.lastActivityAt = new Date();
  latestStop.inactivityMarkedAt = null;
  await latestStop.save();

  request.requestStatus = 'assigned';
  await request.save();

  await addTimelineEvent({
    assignmentId: latestStop._id,
    requestId,
    action: 'ASSIGNMENT_RETRY_SAME_FINDER',
    actorUserId: userId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: {
      reason: String(reason || ''),
      newDeadlineAt: latestStop.deadlineAt,
    },
  });

  try {
    await createNotification({
      userId: latestStop.finder,
      type: 'assignment',
      title: 'Assignment Reopened',
      message: `Owner has retried the same assignment. A new finder deadline has been set.`,
      data: { assignmentId: latestStop._id, requestId },
    });

    await createNotification({
      userId: request.owner,
      type: 'assignment',
      title: 'Retry Started With Same Finder',
      message: `Request is active again with same finder and updated assignment deadline.`,
      data: { assignmentId: latestStop._id, requestId },
    });
  } catch (nErr) {
    console.error('Notification failed:', nErr.message);
  }

  return { request, assignment: latestStop };
};

const retryFailedWithDifferentFinder = async (requestId, userId, reason = '') => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');
  if (request.owner.toString() !== userId.toString()) throw new Error('Unauthorized retry attempt');

  const latestStop = await getLatestStoppedAssignment(requestId);
  if (!latestStop || String(latestStop.status) !== 'failed') {
    throw new Error('Only failed assignments can be retried with different finder');
  }

  const lockedPayment = await getLockedPaymentForRequest(requestId, userId);
  if (!lockedPayment) {
    throw new Error('No locked payment found for refund and retry. Please contact admin.');
  }

  const settlement = await applySettlement({
    payment: lockedPayment,
    assignment: latestStop,
    reason: String(reason || 'Retry with different finder after failed state'),
    kind: 'failed_retry_refund',
    requestId,
    actorUserId: userId,
  });

  request.requestStatus = 'pending_payment';
  await request.save();

  try {
    await createNotification({
      userId: latestStop.finder,
      type: 'payment',
      title: 'Assignment Closed For Reassignment',
      message: `Owner chose different finder path after failed deadline. Compensation recorded: Rs ${settlement.finderCompensationAmount}.`,
      data: { requestId, assignmentId: latestStop._id, paymentId: lockedPayment._id },
    });

    await createNotification({
      userId: request.owner,
      type: 'payment',
      title: 'Refund Issued For Retry',
      message: `Refund of Rs ${settlement.ownerRefundAmount} processed. Please complete payment again to reopen this request.`,
      data: { requestId, paymentId: lockedPayment._id },
    });
  } catch (nErr) {
    console.error('Notification failed:', nErr.message);
  }

  return {
    request,
    payment: settlement.payment,
    settlement,
  };
};

const dropRequestByOwner = async (requestId, userId, options = {}) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');
  if (request.owner.toString() !== userId.toString()) throw new Error('Unauthorized drop attempt');

  const latestStop = await getLatestStoppedAssignment(requestId);
  if (!latestStop || !['expired', 'failed'].includes(String(latestStop.status))) {
    throw new Error('Only expired or failed assignments can be dropped from owner controls');
  }

  const mode = String(options.mode || latestStop.status).toLowerCase();
  if (!['expired', 'failed'].includes(mode)) {
    throw new Error('mode must be expired or failed');
  }

  const lockedPayment = await getLockedPaymentForRequest(requestId, userId);
  if (!lockedPayment) {
    throw new Error('No locked payment found for drop settlement. Please contact admin.');
  }

  if (mode === 'expired') {
    latestStop.status = 'cancelled';
  } else {
    latestStop.status = 'failed';
  }
  await latestStop.save();

  const settlement = await applySettlement({
    payment: lockedPayment,
    assignment: latestStop,
    reason: String(options.reason || `Owner dropped request after ${mode}`),
    kind: mode === 'failed' ? 'failed_drop' : 'expired_drop',
    requestId,
    actorUserId: userId,
  });

  request.requestStatus = mode === 'failed' ? 'failed' : 'cancelled';
  await request.save();

  try {
    await createNotification({
      userId: latestStop.finder,
      type: 'payment',
      title: 'Owner Closed Request',
      message: `Owner has dropped this request. Compensation Rs ${settlement.finderCompensationAmount} has been recorded for your side.`,
      data: { requestId, assignmentId: latestStop._id, paymentId: lockedPayment._id },
    });
    await createNotification({
      userId: request.owner,
      type: 'payment',
      title: 'Request Dropped',
      message: `Request dropped successfully. Owner refund: Rs ${settlement.ownerRefundAmount}. Finder compensation: Rs ${settlement.finderCompensationAmount}.`,
      data: { requestId, assignmentId: latestStop._id, paymentId: lockedPayment._id },
    });
  } catch (nErr) {
    console.error('Notification failed:', nErr.message);
  }

  return {
    request,
    assignment: latestStop,
    payment: settlement.payment,
    settlement,
  };
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

    await createNotification({
      userId: assignment.finder,
      type: 'assignment',
      title: 'Break Applied',
      message: `You paused "${assignment.request.itemName}". Resume within 15 minutes for fair extension.`,
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

    await createNotification({
      userId: assignment.finder,
      type: 'assignment',
      title: 'Break Ended',
      message: `Assignment resumed for "${assignment.request.itemName}". Keep posting updates to avoid inactivity.`,
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
  syncAssignmentStatus,
  getAssignmentTimelineByAssignment,
  getAssignmentTimelineByRequest,
  completeAssignmentByOwner,
  retryExpiredAssignment,
  retryExpiredWithSameFinder,
  retryFailedWithDifferentFinder,
  dropRequestByOwner,
  pauseAssignment,
  resumeAssignment,
  calculateSettlementAmounts,
};
