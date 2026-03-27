const User = require('../users/user.model');
const LostItemRequest = require('../requests/request.model');
const FinderAssignment = require('../assignments/assignment.model');
const AssignmentApplication = require('../assignments/assignmentApplication.model');
const AssignmentTimelineEvent = require('../assignments/assignmentTimeline.model');
const Dispute = require('../disputes/dispute.model');
const Payment = require('../payments/payment.model');
const Payout = require('../payouts/payout.model');
const EvidenceFile = require('../evidence/evidence.model');
const TrackingUpdate = require('../tracking/tracking.model');
const Notification = require('../notifications/notification.model');
const Conversation = require('../chat/conversation.model');
const Message = require('../chat/message.model');
const { createNotification } = require('../notifications/notification.service');
const { logAction, getLogs } = require('../auditLogs/auditLog.service');
const refundService = require('../refunds/refund.service');
const payoutService = require('../payouts/payout.service');
const AdminSystemSetting = require('./systemSetting.model');
const { calculateDistance } = require('../../utils/distance');

const DAY_MS = 24 * 60 * 60 * 1000;

const toPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit) || 1,
});

const parsePageParams = (page, limit, defaultLimit = 20) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.max(parseInt(limit, 10) || defaultLimit, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const buildTrackingSuspicion = (updates = []) => {
  if (updates.length < 2) {
    return {
      totalUpdates: updates.length,
      avgGapMinutes: 0,
      maxGapMinutes: 0,
      repeatedLocationRuns: 0,
      suspiciousJumps: 0,
      noMovementLongGap: 0,
    };
  }

  let gapTotal = 0;
  let maxGap = 0;
  let repeatedLocationRuns = 0;
  let suspiciousJumps = 0;
  let noMovementLongGap = 0;

  for (let index = 1; index < updates.length; index += 1) {
    const previous = updates[index - 1];
    const current = updates[index];

    const previousMs = new Date(previous.createdAt).getTime();
    const currentMs = new Date(current.createdAt).getTime();
    const gapMinutes = Math.max((currentMs - previousMs) / (1000 * 60), 0);

    gapTotal += gapMinutes;
    maxGap = Math.max(maxGap, gapMinutes);

    if (gapMinutes >= 60) {
      noMovementLongGap += 1;
    }

    const hasCoords = Number.isFinite(previous.currentLat)
      && Number.isFinite(previous.currentLng)
      && Number.isFinite(current.currentLat)
      && Number.isFinite(current.currentLng);

    if (!hasCoords) continue;

    const distanceKm = calculateDistance(
      Number(previous.currentLat),
      Number(previous.currentLng),
      Number(current.currentLat),
      Number(current.currentLng)
    );

    if (distanceKm <= 0.02) {
      repeatedLocationRuns += 1;
    }

    if (gapMinutes <= 10 && distanceKm >= 10) {
      suspiciousJumps += 1;
    }
  }

  return {
    totalUpdates: updates.length,
    avgGapMinutes: Number((gapTotal / (updates.length - 1)).toFixed(2)),
    maxGapMinutes: Number(maxGap.toFixed(2)),
    repeatedLocationRuns,
    suspiciousJumps,
    noMovementLongGap,
  };
};

const getDashboardStats = async () => {
  const now = Date.now();
  const last24h = new Date(now - DAY_MS);
  const last7d = new Date(now - (7 * DAY_MS));

  const [
    totalUsers,
    activeUsers,
    totalRequests,
    activeAssignments,
    completedAssignments,
    failedAssignments,
    activeDisputes,
    paymentSummary,
    requestsPerDay,
    recentInactiveAssignments,
    previousInactiveAssignments,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ accountStatus: 'active', updatedAt: { $gte: last24h } }),
    LostItemRequest.countDocuments(),
    FinderAssignment.countDocuments({ status: { $in: ['active', 'inactive', 'paused'] } }),
    FinderAssignment.countDocuments({ status: 'completed' }),
    FinderAssignment.countDocuments({ status: { $in: ['expired', 'cancelled'] } }),
    Dispute.countDocuments({ status: 'open' }),
    Payment.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    LostItemRequest.aggregate([
      { $match: { createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FinderAssignment.countDocuments({ status: 'inactive', updatedAt: { $gte: last24h } }),
    FinderAssignment.countDocuments({ status: 'inactive', updatedAt: { $gte: new Date(now - 8 * DAY_MS), $lt: new Date(now - DAY_MS) } }),
  ]);

  const paymentStats = paymentSummary.reduce((acc, row) => {
    acc[row._id] = {
      count: row.count,
      totalAmount: row.totalAmount,
    };
    return acc;
  }, {});

  const totalAssignments = activeAssignments + completedAssignments + failedAssignments;
  const completionRate = totalAssignments ? Number(((completedAssignments / totalAssignments) * 100).toFixed(2)) : 0;
  const failureRate = totalAssignments ? Number(((failedAssignments / totalAssignments) * 100).toFixed(2)) : 0;
  const disputeRate = totalAssignments ? Number(((activeDisputes / totalAssignments) * 100).toFixed(2)) : 0;

  const [highDisputeRows, repeatedFailureRows, suspiciousTrackingRows, paymentIssueRows] = await Promise.all([
    Dispute.aggregate([
      { $group: { _id: '$raisedBy', disputeCount: { $sum: 1 } } },
      { $match: { disputeCount: { $gte: 2 } } },
      { $sort: { disputeCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          full_name: '$user.full_name',
          role: '$user.role',
          disputeCount: 1,
        },
      },
    ]),
    FinderAssignment.aggregate([
      { $match: { status: { $in: ['expired', 'cancelled'] } } },
      { $group: { _id: '$finder', failedCount: { $sum: 1 } } },
      { $match: { failedCount: { $gte: 3 } } },
      { $sort: { failedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'finder',
        },
      },
      { $unwind: '$finder' },
      {
        $project: {
          _id: 0,
          userId: '$finder._id',
          full_name: '$finder.full_name',
          failedCount: 1,
        },
      },
    ]),
    TrackingUpdate.aggregate([
      { $match: { createdAt: { $gte: last7d }, currentLat: { $ne: null }, currentLng: { $ne: null } } },
      {
        $group: {
          _id: {
            finderId: '$finderId',
            lat: { $round: ['$currentLat', 4] },
            lng: { $round: ['$currentLng', 4] },
          },
          repeatCount: { $sum: 1 },
        },
      },
      { $match: { repeatCount: { $gte: 10 } } },
      { $sort: { repeatCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id.finderId',
          foreignField: '_id',
          as: 'finder',
        },
      },
      { $unwind: '$finder' },
      {
        $project: {
          _id: 0,
          finderId: '$finder._id',
          full_name: '$finder.full_name',
          repeatCount: 1,
          lat: '$_id.lat',
          lng: '$_id.lng',
        },
      },
    ]),
    Payment.find({
      $or: [
        { paymentStatus: 'pending', createdAt: { $lt: new Date(now - DAY_MS) } },
        { paymentStatus: 'locked', createdAt: { $lt: new Date(now - (3 * DAY_MS)) } },
      ],
    })
      .populate('owner', 'full_name email')
      .populate('request', 'itemName requestStatus')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  return {
    coreMetrics: {
      totalUsers,
      activeUsers,
      totalRequests,
      activeAssignments,
      completedAssignments,
      failedAssignments,
      payments: {
        pending: paymentStats.pending || { count: 0, totalAmount: 0 },
        locked: paymentStats.locked || { count: 0, totalAmount: 0 },
        released: paymentStats.released || { count: 0, totalAmount: 0 },
        refunded: paymentStats.refunded || { count: 0, totalAmount: 0 },
      },
      activeDisputes,
    },
    trends: {
      requestsPerDay,
      completionRate,
      failureRate,
      disputeRate,
    },
    alerts: {
      highDisputeUsers: highDisputeRows,
      repeatedFinderFailures: repeatedFailureRows,
      suspiciousFinderActivity: suspiciousTrackingRows,
      paymentIssues: paymentIssueRows,
      inactiveAssignmentsSpike: {
        last24hCount: recentInactiveAssignments,
        previous7dCount: previousInactiveAssignments,
        isSpike: recentInactiveAssignments >= Math.max(5, Math.ceil(previousInactiveAssignments / 7)),
      },
    },
  };
};

const listUsers = async (filters = {}) => {
  const { role, status, verification, q, page, limit } = filters;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (role && ['owner', 'finder', 'admin'].includes(role)) query.role = role;
  if (status && ['active', 'suspended', 'blocked'].includes(status)) query.accountStatus = status;
  if (verification === 'verified') query.isVerified = true;
  if (verification === 'pending') query.isVerified = false;
  if (q) {
    query.$or = [
      { full_name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    User.find(query)
      .select('full_name email phone role ratingAvg ratingCount isVerified accountStatus createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query),
  ]);

  return {
    rows,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');

  const [
    totalRequests,
    assignmentRows,
    disputesRaised,
    disputesAgainst,
    ownerPayments,
    finderPayouts,
    recentTracking,
    openDisputes,
  ] = await Promise.all([
    LostItemRequest.countDocuments({ owner: userId }),
    FinderAssignment.find({ finder: userId }).select('status createdAt updatedAt request'),
    Dispute.countDocuments({ raisedBy: userId }),
    Dispute.countDocuments({ againstUser: userId }),
    Payment.find({ owner: userId }).select('amount paymentStatus createdAt'),
    Payout.find({ finder: userId }).select('payoutAmount payoutStatus processedAt createdAt'),
    TrackingUpdate.find({ finderId: userId }).sort({ createdAt: -1 }).limit(30),
    Dispute.countDocuments({ $or: [{ raisedBy: userId }, { againstUser: userId }], status: 'open' }),
  ]);

  const assignmentTotal = assignmentRows.length;
  const completedAssignments = assignmentRows.filter((row) => row.status === 'completed').length;
  const failedAssignments = assignmentRows.filter((row) => ['expired', 'cancelled'].includes(row.status)).length;
  const successRate = assignmentTotal ? Number(((completedAssignments / assignmentTotal) * 100).toFixed(2)) : 0;
  const failureRate = assignmentTotal ? Number(((failedAssignments / assignmentTotal) * 100).toFixed(2)) : 0;

  const ownerPaymentSummary = ownerPayments.reduce((acc, payment) => {
    acc.total += Number(payment.amount || 0);
    const key = String(payment.paymentStatus || 'unknown');
    acc.byStatus[key] = (acc.byStatus[key] || 0) + 1;
    return acc;
  }, { total: 0, byStatus: {} });

  const finderPayoutSummary = finderPayouts.reduce((acc, payout) => {
    const amount = Number(payout.payoutAmount || 0);
    if (String(payout.payoutStatus) === 'processed') acc.totalProcessed += amount;
    if (String(payout.payoutStatus) === 'pending') acc.totalPending += amount;
    acc.total += amount;
    return acc;
  }, { total: 0, totalProcessed: 0, totalPending: 0 });

  const trackingSuspicion = buildTrackingSuspicion([...recentTracking].reverse());

  return {
    user,
    analytics: {
      totalRequests,
      totalAssignments: assignmentTotal,
      completedAssignments,
      failedAssignments,
      successRate,
      failureRate,
      disputes: {
        raised: disputesRaised,
        against: disputesAgainst,
        open: openDisputes,
      },
      finderEarnings: finderPayoutSummary,
      ownerPayments: ownerPaymentSummary,
      tracking: {
        recentLogs: recentTracking,
        suspicion: trackingSuspicion,
      },
    },
  };
};

const verifyFinder = async (userId, isApproved, adminId, reason = '') => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'finder') throw new Error('Only finder accounts can be verified');

  user.isVerified = Boolean(isApproved);
  await user.save();

  await logAction({
    userId: adminId,
    action: isApproved ? 'ADMIN_FINDER_VERIFIED' : 'ADMIN_FINDER_REJECTED',
    entityType: 'User',
    entityId: user._id,
    details: { reason: reason || '' },
  });

  try {
    await createNotification({
      userId: user._id,
      type: 'account',
      title: isApproved ? 'Finder Verification Approved' : 'Finder Verification Rejected',
      message: isApproved
        ? 'Your finder profile is verified. You can now apply for requests.'
        : `Your finder verification was rejected.${reason ? ` Reason: ${reason}` : ''}`,
    });
  } catch (error) {
    console.error(error);
  }

  return user;
};

const updateUserStatus = async (userId, status, adminId, reason = '') => {
  if (!['active', 'suspended', 'blocked'].includes(String(status || '').toLowerCase())) {
    throw new Error('Invalid account status');
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.accountStatus = status;
  await user.save();

  await logAction({
    userId: adminId,
    action: 'ADMIN_USER_STATUS_UPDATED',
    entityType: 'User',
    entityId: user._id,
    details: { status, reason },
  });

  try {
    await createNotification({
      userId: user._id,
      type: 'account',
      title: 'Account Status Updated',
      message: `Your account status has been changed to ${String(status).toUpperCase()}.${reason ? ` Reason: ${reason}` : ''}`,
    });
  } catch (error) {
    console.error(error);
  }

  return user;
};

const listRequests = async (filters = {}) => {
  const { status, ownerId, page, limit } = filters;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (ownerId) query.owner = ownerId;
  if (status && !['draft', 'expired'].includes(status)) query.requestStatus = status;
  if (status === 'draft') query.requestStatus = 'pending_payment';

  const [rows, total] = await Promise.all([
    LostItemRequest.find(query)
      .populate('owner', 'full_name email phone ratingAvg')
      .populate('planId', 'planName rewardAmount searchDuration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    LostItemRequest.countDocuments(query),
  ]);

  const requestIds = rows.map((row) => row._id);
  const [assignments, payments] = await Promise.all([
    FinderAssignment.find({ request: { $in: requestIds } }).select('request status finder assignedAt deadlineAt'),
    Payment.find({ request: { $in: requestIds } }).select('request paymentStatus amount paidAt releasedAt refundAmount').sort({ createdAt: -1 }),
  ]);

  const assignmentByRequest = assignments.reduce((acc, item) => {
    acc[String(item.request)] = item;
    return acc;
  }, {});

  const paymentByRequest = payments.reduce((acc, item) => {
    const key = String(item.request);
    if (!acc[key]) acc[key] = item;
    return acc;
  }, {});

  const enriched = rows
    .map((item) => ({
      ...item.toObject(),
      assignment: assignmentByRequest[String(item._id)] || null,
      payment: paymentByRequest[String(item._id)] || null,
    }))
    .filter((item) => {
      if (status !== 'expired') return true;
      return String(item.assignment?.status || '').toLowerCase() === 'expired';
    });

  return {
    rows: enriched,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getRequestDetails = async (requestId) => {
  const request = await LostItemRequest.findById(requestId)
    .populate('owner', 'full_name email phone role ratingAvg ratingCount accountStatus')
    .populate('finders', 'full_name email phone ratingAvg ratingCount isVerified')
    .populate('planId');

  if (!request) throw new Error('Request not found');

  const assignment = await FinderAssignment.findOne({ request: requestId })
    .populate('finder', 'full_name email phone ratingAvg ratingCount accountStatus')
    .populate('request');

  const [payment, applications, timeline] = await Promise.all([
    Payment.findOne({ request: requestId })
      .populate('owner', 'full_name email')
      .populate('servicePlan'),
    AssignmentApplication.find({ request: requestId })
      .populate('finder', 'full_name email phone ratingAvg ratingCount isVerified')
      .sort({ createdAt: -1 }),
    AssignmentTimelineEvent.find({ request: requestId })
      .populate('actor.user', 'full_name email role')
      .sort({ createdAt: -1 })
      .limit(200),
  ]);

  let evidence = null;
  let tracking = [];
  let conversation = null;
  let messages = [];

  if (assignment) {
    [evidence, tracking, conversation] = await Promise.all([
      EvidenceFile.findOne({ assignment: assignment._id })
        .populate('finder', 'full_name email')
        .populate('verifiedBy', 'full_name email role'),
      TrackingUpdate.find({ assignmentId: assignment._id }).sort({ createdAt: -1 }).limit(200),
      Conversation.findOne({ assignment: assignment._id })
        .populate('owner', 'full_name email')
        .populate('finder', 'full_name email'),
    ]);

    if (conversation) {
      messages = await Message.find({ conversation: conversation._id })
        .populate('sender', 'full_name email role')
        .sort({ createdAt: -1 })
        .limit(300);
    }
  }

  return {
    request,
    owner: request.owner,
    assignment,
    payment,
    applications,
    timeline,
    evidence,
    tracking,
    chatHistory: {
      conversation,
      messages,
    },
  };
};

const deleteRequest = async (requestId, adminId, reason = '') => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  request.requestStatus = 'cancelled';
  await request.save();

  await FinderAssignment.updateMany(
    { request: requestId, status: { $in: ['active', 'inactive', 'paused'] } },
    { $set: { status: 'cancelled' } }
  );

  await logAction({
    userId: adminId,
    action: 'ADMIN_REQUEST_DELETED',
    entityType: 'LostItemRequest',
    entityId: request._id,
    details: { reason },
  });

  return request;
};

const forceCloseRequest = async (requestId, adminId, reason = '') => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  request.requestStatus = 'cancelled';
  await request.save();

  await FinderAssignment.updateMany(
    { request: requestId, status: { $in: ['active', 'inactive', 'paused'] } },
    { $set: { status: 'cancelled' } }
  );

  await AssignmentTimelineEvent.create({
    request: request._id,
    actor: {
      user: adminId,
      role: 'admin',
      label: 'Admin',
    },
    action: 'REQUEST_FORCE_CLOSED',
    details: { reason },
  });

  await logAction({
    userId: adminId,
    action: 'ADMIN_REQUEST_FORCE_CLOSE',
    entityType: 'LostItemRequest',
    entityId: request._id,
    details: { reason },
  });

  return request;
};

const reopenRequest = async (requestId, adminId, reason = '') => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  const activeAssignment = await FinderAssignment.findOne({
    request: requestId,
    status: { $in: ['active', 'inactive', 'paused'] },
  });

  if (activeAssignment) {
    throw new Error('Cannot reopen request while an active assignment exists');
  }

  const payment = await Payment.findOne({ request: requestId }).sort({ createdAt: -1 });
  request.requestStatus = payment?.paymentStatus === 'locked' ? 'open' : 'pending_payment';
  await request.save();

  await AssignmentTimelineEvent.create({
    request: request._id,
    actor: {
      user: adminId,
      role: 'admin',
      label: 'Admin',
    },
    action: 'REQUEST_REOPENED',
    details: { reason },
  });

  await logAction({
    userId: adminId,
    action: 'ADMIN_REQUEST_REOPEN',
    entityType: 'LostItemRequest',
    entityId: request._id,
    details: { reason, paymentStatus: payment?.paymentStatus || 'none' },
  });

  return request;
};

const listAssignments = async (filters = {}) => {
  const { status, page, limit } = filters;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (status) query.status = status;

  const [rows, total] = await Promise.all([
    FinderAssignment.find(query)
      .populate({ path: 'request', populate: { path: 'owner', select: 'full_name email phone' } })
      .populate('finder', 'full_name email phone ratingAvg ratingCount accountStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    FinderAssignment.countDocuments(query),
  ]);

  return {
    rows,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getAssignmentDetails = async (assignmentId) => {
  const assignment = await FinderAssignment.findById(assignmentId)
    .populate({ path: 'request', populate: { path: 'owner', select: 'full_name email phone ratingAvg ratingCount accountStatus' } })
    .populate('finder', 'full_name email phone ratingAvg ratingCount accountStatus');

  if (!assignment) throw new Error('Assignment not found');

  const [tracking, evidence, timeline, dispute, payment, conversation] = await Promise.all([
    TrackingUpdate.find({ assignmentId }).sort({ createdAt: -1 }).limit(300),
    EvidenceFile.findOne({ assignment: assignmentId }).populate('verifiedBy', 'full_name email role'),
    AssignmentTimelineEvent.find({ assignment: assignmentId }).populate('actor.user', 'full_name email role').sort({ createdAt: -1 }).limit(300),
    Dispute.findOne({ assignment: assignmentId }).sort({ createdAt: -1 }).populate('raisedBy againstUser', 'full_name email role'),
    Payment.findOne({ request: assignment.request?._id }).sort({ createdAt: -1 }).populate('owner', 'full_name email'),
    Conversation.findOne({ assignment: assignmentId }),
  ]);

  let messages = [];
  if (conversation) {
    messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'full_name email role')
      .sort({ createdAt: -1 })
      .limit(300);
  }

  return {
    assignment,
    owner: assignment.request?.owner,
    finder: assignment.finder,
    tracking,
    evidence,
    timeline,
    dispute,
    payment,
    chatLogs: {
      conversation,
      messages,
    },
  };
};

const updateAssignmentStatus = async (assignmentId, status, adminId, reason = '') => {
  const targetStatus = String(status || '').toLowerCase();
  if (!['active', 'inactive', 'expired', 'completed', 'cancelled', 'paused', 'failed'].includes(targetStatus)) {
    throw new Error('Invalid assignment status');
  }

  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  assignment.status = targetStatus;
  assignment.lastActivityAt = new Date();
  await assignment.save();

  if (assignment.request) {
    if (targetStatus === 'completed') assignment.request.requestStatus = 'completed';
    if (['expired', 'cancelled'].includes(targetStatus)) assignment.request.requestStatus = 'cancelled';
    if (targetStatus === 'failed') assignment.request.requestStatus = 'failed';
    if (['active', 'inactive', 'paused'].includes(targetStatus) && assignment.request.requestStatus === 'cancelled') {
      assignment.request.requestStatus = 'assigned';
    }
    await assignment.request.save();
  }

  await AssignmentTimelineEvent.create({
    assignment: assignment._id,
    request: assignment.request?._id,
    actor: {
      user: adminId,
      role: 'admin',
      label: 'Admin',
    },
    action: 'ASSIGNMENT_STATUS_UPDATED_BY_ADMIN',
    details: { status: targetStatus, reason },
  });

  await logAction({
    userId: adminId,
    action: 'ADMIN_ASSIGNMENT_STATUS_UPDATE',
    entityType: 'FinderAssignment',
    entityId: assignment._id,
    details: { status: targetStatus, reason },
  });

  return assignment;
};

const extendAssignmentDeadline = async (assignmentId, extensionMinutes, adminId, reason = '') => {
  const minutes = parseInt(extensionMinutes, 10);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > (48 * 60)) {
    throw new Error('extensionMinutes must be between 1 and 2880');
  }

  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  const baseMs = assignment.deadlineAt ? new Date(assignment.deadlineAt).getTime() : Date.now();
  assignment.deadlineAt = new Date(baseMs + (minutes * 60 * 1000));
  await assignment.save();

  await AssignmentTimelineEvent.create({
    assignment: assignment._id,
    request: assignment.request?._id,
    actor: {
      user: adminId,
      role: 'admin',
      label: 'Admin',
    },
    action: 'ASSIGNMENT_DEADLINE_EXTENDED',
    details: { extensionMinutes: minutes, reason, deadlineAt: assignment.deadlineAt },
  });

  await logAction({
    userId: adminId,
    action: 'ADMIN_ASSIGNMENT_DEADLINE_EXTEND',
    entityType: 'FinderAssignment',
    entityId: assignment._id,
    details: { extensionMinutes: minutes, reason },
  });

  return assignment;
};

const getTrackingAnalytics = async (assignmentId) => {
  const assignment = await FinderAssignment.findById(assignmentId)
    .populate({ path: 'request', populate: { path: 'owner', select: 'full_name email' } })
    .populate('finder', 'full_name email');

  if (!assignment) throw new Error('Assignment not found');

  const updates = await TrackingUpdate.find({ assignmentId }).sort({ createdAt: 1 });
  const analysis = buildTrackingSuspicion(updates);

  const path = updates
    .filter((row) => Number.isFinite(row.currentLat) && Number.isFinite(row.currentLng))
    .map((row) => ({
      lat: row.currentLat,
      lng: row.currentLng,
      at: row.createdAt,
      statusUpdate: row.statusUpdate,
    }));

  return {
    assignment,
    analytics: analysis,
    movementPath: path,
    updates,
    fraudSignals: {
      noMovementForLongTime: analysis.noMovementLongGap > 0,
      randomLocationJumps: analysis.suspiciousJumps > 0,
      repeatedSameLocation: analysis.repeatedLocationRuns > 5,
    },
  };
};

const listDisputes = async (filters = {}) => {
  const { status, page, limit } = filters;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (status) query.status = status;

  const [rows, total] = await Promise.all([
    Dispute.find(query)
      .populate('raisedBy', 'full_name email role')
      .populate('againstUser', 'full_name email role')
      .populate('assignment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Dispute.countDocuments(query),
  ]);

  return {
    rows,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getDisputeDetails = async (disputeId) => {
  const dispute = await Dispute.findById(disputeId)
    .populate('raisedBy', 'full_name email role ratingAvg ratingCount')
    .populate('againstUser', 'full_name email role ratingAvg ratingCount')
    .populate('assignment')
    .populate('request');

  if (!dispute) throw new Error('Dispute not found');

  const assignment = await FinderAssignment.findById(dispute.assignment)
    .populate({ path: 'request', populate: { path: 'owner', select: 'full_name email role' } })
    .populate('finder', 'full_name email role');

  const [evidence, tracking, timeline, conversation] = await Promise.all([
    EvidenceFile.findOne({ assignment: dispute.assignment }),
    TrackingUpdate.find({ assignmentId: dispute.assignment }).sort({ createdAt: -1 }).limit(300),
    AssignmentTimelineEvent.find({ assignment: dispute.assignment }).populate('actor.user', 'full_name email role').sort({ createdAt: -1 }).limit(300),
    Conversation.findOne({ assignment: dispute.assignment }),
  ]);

  let messages = [];
  if (conversation) {
    messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'full_name email role')
      .sort({ createdAt: -1 })
      .limit(300);
  }

  return {
    dispute,
    assignment,
    evidence,
    tracking,
    timeline,
    chatHistory: {
      conversation,
      messages,
    },
  };
};

const resolveDispute = async (disputeId, adminDecision, resolutionDetails, adminId, options = {}) => {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute || dispute.status === 'resolved') {
    throw new Error('Invalid or resolved dispute');
  }

  const assignment = await FinderAssignment.findById(dispute.assignment).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  const payment = await Payment.findOne({ request: assignment.request._id }).sort({ createdAt: -1 });

  if (adminDecision === 'owner_wins') {
    if (payment) {
      await refundService.processRefund(payment._id, `Admin dispute resolution: ${resolutionDetails}`);
    }
    assignment.status = 'cancelled';
    assignment.isDisputed = false;
    await assignment.save();

    assignment.request.requestStatus = 'cancelled';
    await assignment.request.save();

    if (options.penalizeFinder) {
      await updateUserStatus(assignment.finder, 'suspended', adminId, 'Penalty from dispute resolution');
    }
  } else if (adminDecision === 'finder_wins') {
    if (payment) {
      payment.paymentStatus = 'released';
      payment.releasedAt = new Date();
      payment.releaseReason = `Admin dispute resolution: ${resolutionDetails}`;
      await payment.save();

      const existingPayout = await Payout.findOne({ payment: payment._id });
      if (!existingPayout) {
        await payoutService.createPayout(payment._id, assignment._id, assignment.finder, payment.amount);
      }
    }

    assignment.status = 'completed';
    assignment.isDisputed = false;
    assignment.evidenceVerified = true;
    assignment.chatUnlocked = true;
    await assignment.save();

    assignment.request.requestStatus = 'completed';
    assignment.request.itemConfirmed = true;
    assignment.request.confirmationDate = new Date();
    await assignment.request.save();

    if (options.penalizeOwner) {
      await updateUserStatus(assignment.request.owner, 'suspended', adminId, 'Penalty from dispute resolution');
    }
  } else {
    throw new Error('adminDecision must be owner_wins or finder_wins');
  }

  dispute.status = 'resolved';
  dispute.adminDecision = adminDecision;
  dispute.resolvedAt = new Date();
  await dispute.save();

  await AssignmentTimelineEvent.create({
    assignment: assignment._id,
    request: assignment.request._id,
    actor: {
      user: adminId,
      role: 'admin',
      label: 'Admin',
    },
    action: 'DISPUTE_RESOLVED_BY_ADMIN',
    details: {
      adminDecision,
      resolutionDetails,
      penalizeFinder: Boolean(options.penalizeFinder),
      penalizeOwner: Boolean(options.penalizeOwner),
    },
  });

  await logAction({
    userId: adminId,
    action: 'ADMIN_DISPUTE_RESOLVED',
    entityType: 'Dispute',
    entityId: dispute._id,
    details: {
      adminDecision,
      resolutionDetails,
      penalizeFinder: Boolean(options.penalizeFinder),
      penalizeOwner: Boolean(options.penalizeOwner),
    },
  });

  try {
    const resultLabel = adminDecision === 'owner_wins' ? 'Owner claim accepted' : 'Finder claim accepted';
    await Promise.all([
      createNotification({
        userId: assignment.request.owner,
        type: 'dispute',
        title: 'Dispute Resolved',
        message: `Admin decision: ${resultLabel}. ${resolutionDetails}`,
      }),
      createNotification({
        userId: assignment.finder,
        type: 'dispute',
        title: 'Dispute Resolved',
        message: `Admin decision: ${resultLabel}. ${resolutionDetails}`,
      }),
    ]);
  } catch (error) {
    console.error(error);
  }

  return dispute;
};

const listPayments = async (filters = {}) => {
  const { status, flagged, page, limit } = filters;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (status) query.paymentStatus = status;
  if (String(flagged) === 'true') query.flaggedByAdmin = true;

  const [rows, total] = await Promise.all([
    Payment.find(query)
      .populate('owner', 'full_name email phone')
      .populate('request', 'itemName requestStatus')
      .populate('servicePlan', 'planName rewardAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Payment.countDocuments(query),
  ]);

  return {
    rows,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getPaymentDetails = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate('owner', 'full_name email phone role')
    .populate('request', 'itemName requestStatus owner')
    .populate('servicePlan');

  if (!payment) throw new Error('Payment not found');

  const assignment = await FinderAssignment.findOne({ request: payment.request?._id })
    .populate('finder', 'full_name email phone role ratingAvg ratingCount')
    .populate('request');

  const payout = await Payout.findOne({ payment: payment._id });

  return {
    payment,
    assignment,
    payout,
  };
};

const forceReleasePayment = async (paymentId, adminId, reason = '') => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  if (!['locked', 'pending'].includes(String(payment.paymentStatus || '').toLowerCase())) {
    throw new Error(`Cannot force release payment in ${payment.paymentStatus} state`);
  }

  const assignment = await FinderAssignment.findOne({ request: payment.request })
    .sort({ createdAt: -1 });

  payment.paymentStatus = 'released';
  payment.releasedAt = new Date();
  payment.releaseReason = `Admin force release: ${reason || 'no reason provided'}`;
  await payment.save();

  if (assignment) {
    assignment.status = 'completed';
    assignment.evidenceVerified = true;
    assignment.chatUnlocked = true;
    await assignment.save();
  }

  const request = await LostItemRequest.findById(payment.request);
  if (request) {
    request.requestStatus = 'completed';
    request.itemConfirmed = true;
    request.confirmationDate = new Date();
    await request.save();
  }

  const existingPayout = await Payout.findOne({ payment: payment._id });
  if (assignment && !existingPayout) {
    await payoutService.createPayout(payment._id, assignment._id, assignment.finder, payment.amount);
  }

  await logAction({
    userId: adminId,
    action: 'ADMIN_PAYMENT_FORCE_RELEASE',
    entityType: 'Payment',
    entityId: payment._id,
    details: { reason },
  });

  return payment;
};

const refundPaymentByAdmin = async (paymentId, adminId, reason = '') => {
  const payment = await refundService.processRefund(paymentId, reason || 'Admin initiated refund');

  await logAction({
    userId: adminId,
    action: 'ADMIN_PAYMENT_REFUND',
    entityType: 'Payment',
    entityId: payment._id,
    details: { reason },
  });

  return payment;
};

const flagSuspiciousPayment = async (paymentId, adminId, reason = '') => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  payment.flaggedByAdmin = true;
  payment.flaggedAt = new Date();
  payment.flaggedReason = reason || 'Suspicious activity flagged by admin';
  payment.flaggedBy = adminId;
  await payment.save();

  await logAction({
    userId: adminId,
    action: 'ADMIN_PAYMENT_FLAGGED',
    entityType: 'Payment',
    entityId: payment._id,
    details: { reason },
  });

  return payment;
};

const getAuditLogsForAdmin = async (params = {}) => {
  const { action, entityType, user, page, limit, search } = params;
  const filters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (user) filters.user = user;

  const result = await getLogs(filters, parseInt(page, 10) || 1, parseInt(limit, 10) || 50);
  if (!search) return result;

  const q = String(search).toLowerCase();
  const filtered = result.logs.filter((log) => {
    const detailsText = JSON.stringify(log.details || {}).toLowerCase();
    return String(log.action || '').toLowerCase().includes(q)
      || String(log.entityType || '').toLowerCase().includes(q)
      || detailsText.includes(q)
      || String(log?.user?.full_name || '').toLowerCase().includes(q)
      || String(log?.user?.email || '').toLowerCase().includes(q);
  });

  return {
    ...result,
    logs: filtered,
    pagination: {
      ...result.pagination,
      total: filtered.length,
      pages: 1,
      page: 1,
    },
  };
};

const getNotificationMonitoring = async (params = {}) => {
  const { page, limit, unreadOnly } = params;
  const { page: safePage, limit: safeLimit, skip } = parsePageParams(page, limit);

  const query = {};
  if (String(unreadOnly) === 'true') query.isRead = false;

  const [rows, total, unreadCount, byType, failedCount] = await Promise.all([
    Notification.find(query)
      .populate('user', 'full_name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({ isRead: false }),
    Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    getLogs({ action: 'NOTIFICATION_FAILED' }, 1, 1).then((res) => res.pagination.total).catch(() => 0),
  ]);

  return {
    rows,
    unreadCount,
    failedCount,
    byType,
    pagination: toPagination(safePage, safeLimit, total),
  };
};

const getFraudSignals = async ({ threshold = 50 } = {}) => {
  const [finders, assignments, disputes, tracking] = await Promise.all([
    User.find({ role: 'finder' }).select('full_name email accountStatus ratingAvg ratingCount').limit(500),
    FinderAssignment.find({}).select('finder status'),
    Dispute.find({}).select('raisedBy againstUser'),
    TrackingUpdate.find({ createdAt: { $gte: new Date(Date.now() - 14 * DAY_MS) } })
      .select('finderId currentLat currentLng createdAt')
      .sort({ createdAt: 1 }),
  ]);

  const assignmentByFinder = assignments.reduce((acc, row) => {
    const key = String(row.finder || '');
    if (!acc[key]) acc[key] = { total: 0, failed: 0, completed: 0 };
    acc[key].total += 1;
    if (['expired', 'cancelled'].includes(row.status)) acc[key].failed += 1;
    if (row.status === 'completed') acc[key].completed += 1;
    return acc;
  }, {});

  const disputeByUser = disputes.reduce((acc, row) => {
    const raised = String(row.raisedBy || '');
    const against = String(row.againstUser || '');
    acc[raised] = (acc[raised] || 0) + 1;
    acc[against] = (acc[against] || 0) + 1;
    return acc;
  }, {});

  const trackingByFinder = tracking.reduce((acc, row) => {
    const key = String(row.finderId || '');
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const rows = finders.map((finder) => {
    const key = String(finder._id);
    const assignmentStats = assignmentByFinder[key] || { total: 0, failed: 0, completed: 0 };
    const disputeCount = disputeByUser[key] || 0;
    const trackingStats = buildTrackingSuspicion(trackingByFinder[key] || []);

    const failureRate = assignmentStats.total
      ? (assignmentStats.failed / assignmentStats.total) * 100
      : 0;

    let riskScore = 0;
    riskScore += Math.min(40, assignmentStats.failed * 8);
    riskScore += Math.min(30, disputeCount * 6);
    riskScore += Math.min(20, trackingStats.suspiciousJumps * 5);
    riskScore += Math.min(10, trackingStats.repeatedLocationRuns > 5 ? 10 : 0);
    riskScore += Math.min(20, failureRate > 50 ? 20 : failureRate / 3);
    riskScore = Math.round(Math.min(riskScore, 100));

    return {
      userId: finder._id,
      full_name: finder.full_name,
      email: finder.email,
      accountStatus: finder.accountStatus,
      assignmentStats,
      disputeCount,
      trackingSignals: {
        suspiciousJumps: trackingStats.suspiciousJumps,
        repeatedLocationRuns: trackingStats.repeatedLocationRuns,
      },
      riskScore,
    };
  })
    .filter((row) => row.riskScore >= Number(threshold || 0))
    .sort((a, b) => b.riskScore - a.riskScore);

  return rows;
};

const getSystemSettings = async () => {
  let settings = await AdminSystemSetting.findOne();
  if (!settings) {
    settings = await AdminSystemSetting.create({});
  }
  return settings;
};

const updateSystemSettings = async (payload = {}, adminId) => {
  let settings = await AdminSystemSetting.findOne();
  if (!settings) settings = await AdminSystemSetting.create({});

  const allowedFields = [
    'defaultAssignmentDeadlineHours',
    'trackingIntervalMinutes',
    'maxEvidenceImages',
    'maxEvidenceVideoSeconds',
    'disputeWindowHours',
  ];

  allowedFields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      settings[key] = payload[key];
    }
  });

  settings.updatedBy = adminId;
  await settings.save();

  await logAction({
    userId: adminId,
    action: 'ADMIN_SYSTEM_SETTINGS_UPDATED',
    entityType: 'AdminSystemSetting',
    entityId: settings._id,
    details: payload,
  });

  return settings;
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserProfile,
  verifyFinder,
  updateUserStatus,
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
  listDisputes,
  getDisputeDetails,
  resolveDispute,
  listPayments,
  getPaymentDetails,
  forceReleasePayment,
  refundPaymentByAdmin,
  flagSuspiciousPayment,
  getAuditLogsForAdmin,
  getNotificationMonitoring,
  getFraudSignals,
  getSystemSettings,
  updateSystemSettings,
};
