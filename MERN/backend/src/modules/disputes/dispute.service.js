const Dispute = require('./dispute.model');
const FinderAssignment = require('../assignments/assignment.model');
const EvidenceFile = require('../evidence/evidence.model');
const Payment = require('../payments/payment.model');
const refundService = require('../refunds/refund.service');
const { createNotification } = require('../notifications/notification.service');
const User = require('../users/user.model');
const LostItemRequest = require('../requests/request.model');
const payoutService = require('../payouts/payout.service');
const assignmentService = require('../assignments/assignment.service');

/**
 * Raise a dispute (Escalation after conflict)
 */
const createDispute = async (assignmentId, userId, reason, description) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  // 1. Identify parties
  const isOwner = assignment.request.owner.toString() === userId.toString();
  const isFinder = assignment.finder.toString() === userId.toString();
  if (!isOwner && !isFinder) throw new Error('Unauthorized');

  const againstUser = isOwner ? assignment.finder : assignment.request.owner;

  // 2. TRIGGER CONDITION: Dispute can only be raised AFTER evidence submitted OR payment locked
  const evidence = await EvidenceFile.findOne({ assignment: assignmentId });
  const payment = await Payment.findOne({ request: assignment.request._id });

  const hasEvidence = !!evidence;
  const isPaymentLocked = payment && payment.paymentStatus === 'locked';

  if (!hasEvidence && !isPaymentLocked) {
    throw new Error('Dispute can only be raised after evidence submission or payment escrow.');
  }

  // 3. Prevent duplicate open disputes
  const existing = await Dispute.findOne({ assignment: assignmentId, status: 'open' });
  if (existing) throw new Error('An open dispute already exists');

  // 4. Create dispute
  const dispute = await Dispute.create({
    assignment: assignmentId,
    request: assignment.request._id,
    raisedBy: userId,
    againstUser,
    reason,
    description,
    evidenceRef: evidence ? evidence._id : null,
  });

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: 'DISPUTE_CREATE',
    entityType: 'Dispute',
    entityId: dispute._id,
    details: { reason, assignmentId },
  });

  // 5. Lock assignment
  assignment.isDisputed = true;
  await assignment.save();

  // 6. Notifications
  try {
    const raisedByUser = await User.findById(userId);
    await createNotification({
      userId: againstUser,
      type: 'dispute',
      title: 'Dispute Raised',
      message: `${raisedByUser.full_name} has raised an escalation: "${reason.replace('_', ' ')}". Assignment is locked.`,
      data: { disputeId: dispute._id },
    });
  } catch (err) {
    console.error(err);
  }

  return dispute;
};

/**
 * Admin Resolution Logic
 */
const resolveDispute = async (disputeId, adminDecision, resolutionDetails, adminId) => {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute || dispute.status === 'resolved') throw new Error('Invalid or resolved dispute');

  const assignment = await FinderAssignment.findById(dispute.assignment).populate('request');
  if (!assignment) throw new Error('Assignment not found for dispute');

  const payment = await Payment.findOne({ request: assignment.request._id });
  if (!payment) throw new Error('Payment not found for dispute assignment');

  if (adminDecision === 'owner_wins') {
    // CASE 1: Owner wins -> Refund + Cancel
    await refundService.processRefund(payment._id, `Dispute resolved (owner_wins): ${resolutionDetails}`);
    assignment.status = 'cancelled';
  } else if (adminDecision === 'finder_wins') {
    // CASE 2: Finder wins -> Force Release + Complete
    if (payment.paymentStatus !== 'released') {
      payment.paymentStatus = 'released';
      payment.releasedAt = new Date();
      payment.releaseReason = 'Admin resolution: ' + resolutionDetails;
      await payment.save();
    }

    assignment.status = 'completed';
    assignment.evidenceVerified = true;
    assignment.chatUnlocked = true;
    assignment.unlockTime = assignment.unlockTime || new Date();
    
    // TRIGGER PAYOUT for finder
    try {
        const paymentWithPlan = await Payment.findById(payment._id).populate('servicePlan');
        const settlement = assignmentService.calculateSettlementAmounts(paymentWithPlan || payment, 'success');
        const finderReward = Number(settlement.successRewardAmount || (payment.amount * 0.7));
        
        await payoutService.createPayout(
          payment._id,
          assignment._id,
          assignment.finder,
          finderReward
        );
    } catch (payoutErr) {
        console.error('Failed to create payout after dispute resolution:', payoutErr.message);
    }

    const request = await LostItemRequest.findById(assignment.request._id);
    if (request) {
        request.requestStatus = 'completed';
        request.itemConfirmed = true;
        request.confirmationDate = new Date();
        await request.save();
    }
  } else {
    throw new Error('adminDecision must be owner_wins or finder_wins');
  }

  // Update dispute status
  dispute.status = 'resolved';
  dispute.adminDecision = adminDecision;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = adminId;
  await dispute.save();

  // Unlock assignment flag (stays in final status: completed/cancelled)
  assignment.isDisputed = false;
  await assignment.save();

  // Resolution Notifications
  try {
    const outcomeMsg = adminDecision === 'owner_wins' ? 'Payment Refunded' : 'Payment Released';
    await Promise.all([
      createNotification({
        userId: assignment.request.owner,
        type: 'dispute',
        title: 'Dispute Resolved',
        message: `Admin decision: ${outcomeMsg}. Details: ${resolutionDetails}`,
      }),
      createNotification({
        userId: assignment.finder,
        type: 'dispute',
        title: 'Dispute Resolved',
        message: `Admin decision: ${outcomeMsg}. Details: ${resolutionDetails}`,
      }),
    ]);
  } catch (err) {
    console.error(err);
  }

  return dispute;
};

const getDispute = async (assignmentId) => {
  return await Dispute.findOne({ assignment: assignmentId }).sort({ createdAt: -1 });
};

const getDisputeByAssignment = async (assignmentId) => getDispute(assignmentId);

module.exports = {
  createDispute,
  resolveDispute,
  getDispute,
  getDisputeByAssignment,
};
