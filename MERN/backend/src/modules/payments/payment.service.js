const Payment = require('./payment.model');
const LostItemRequest = require('../requests/request.model');
const FinderAssignment = require('../assignments/assignment.model');
const User = require('../users/user.model');
const ServicePlan = require('../servicePlans/servicePlan.model');
const Conversation = require('../chat/conversation.model');
const { createNotification } = require('../notifications/notification.service');
const payoutService = require('../payouts/payout.service');
const { addTimelineEvent } = require('../assignments/assignmentTimeline.service');
const { applyTrustEvent } = require('../../utils/trust');

const round2 = (value) => Number(Number(value || 0).toFixed(2));

/**
 * Create a new payment record (initial state: pending)
 */
const createPayment = async (userId, requestId, servicePlanId, amount, paymentMethod) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  // Verify ownership
  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized: You do not own this request');
  }

  // Verify request state
  if (request.requestStatus !== 'pending_payment') {
    throw new Error(`Request is already in ${request.requestStatus} state`);
  }

  // Prevent duplicate payments
  const existing = await Payment.findOne({ request: requestId, paymentStatus: { $ne: 'refunded' } });
  if (existing) {
    throw new Error('A payment record already exists for this request');
  }

  return Payment.create({
    request: requestId,
    owner: userId,
    servicePlan: servicePlanId,
    amount,
    paymentMethod,
    paymentStatus: 'pending',
  });
};

/**
 * Process payment and lock in escrow
 */
const processPayment = async (paymentId, transactionId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.paymentStatus !== 'pending') {
    throw new Error(`Cannot process payment in ${payment.paymentStatus} state`);
  }

  payment.paymentStatus = 'locked';
  payment.transactionId = transactionId;
  payment.paidAt = new Date();
  await payment.save();

  // CRITICAL: Unlock request for finders and set reward amount
  const request = await LostItemRequest.findById(payment.request);
  if (request) {
    const plan = await ServicePlan.findById(payment.servicePlan);
    request.rewardAmount = payment.amount;
    request.requestStatus = 'open';
    await request.save();
  }

  try {
    await createNotification({
      userId: payment.owner,
      type: 'payment',
      title: 'Funds Escrowed',
      message: `Payment for "${request?.itemName}" is now secured. Your request is now live for finders.`,
      data: { requestId: payment.request, paymentId: payment._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return payment;
};

/**
 * Release payment to finder (Final Completion)
 */
const releasePayment = async (paymentId, userId, reason = '') => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  // Security: Only owner can release
  if (payment.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the item owner can release funds');
  }

  if (payment.paymentStatus === 'released') {
    return payment; // Idempotent success if already released
  }

  if (payment.paymentStatus !== 'locked') {
    throw new Error(`Cannot release payment: Transaction is currently in "${payment.paymentStatus}" state. (Must be "locked" for release)`);
  }

  // Find active assignment
  const assignment = await FinderAssignment.findOne({
    request: payment.request,
    status: { $in: ['active', 'inactive'] },
  }).sort({ createdAt: -1 });

  if (!assignment) {
    throw new Error('Release blocked: No active assignment is currently linked to this request for payout.');
  }

  // CRITICAL VALIDATIONS
  if (!assignment.evidenceVerified) {
    throw new Error(`Verification required: The Finder's proof of discovery has not been verified yet. (Current Status: ${assignment.status})`);
  }

  if (assignment.isDisputed) {
    throw new Error('Payment frozen: An active dispute is preventing fund release. Please resolve the dispute first.');
  }

  // Release funds
  payment.paymentStatus = 'released';
  payment.releasedAt = new Date();
  payment.releaseReason = reason;
  await payment.save();

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: 'PAYMENT_RELEASE',
    entityType: 'Payment',
    entityId: payment._id,
    details: { assignmentId: assignment._id, amount: payment.amount },
  });

  // Finalize assignment
  assignment.status = 'completed';
  await assignment.save();

  const finderUser = await User.findById(assignment.finder);
  if (finderUser) {
    applyTrustEvent(finderUser, 'SUCCESSFUL_RETURN');
    finderUser.finderStatus = 'verified';
    await finderUser.save();
  }

  // End chat once assignment is completed, while preserving history.
  await Conversation.findOneAndUpdate(
    { assignment: assignment._id },
    { isActive: false },
    { new: true }
  );

  // Finalize request
  const request = await LostItemRequest.findById(payment.request);
  if (request) {
    request.requestStatus = 'completed'; // or 'found' as per walkthrough
    request.itemConfirmed = true;
    request.confirmationDate = new Date();
    await request.save();
  }

  // 4. Finalize Payout Record (Update existing pending payout to processed)
  try {
    const assignmentService = require('../assignments/assignment.service');
    // Ensure servicePlan is populated for calculation
    const paymentWithPlan = await Payment.findById(payment._id).populate('servicePlan');
    
    // Safety: If somehow service plan is missing, use defaults in calculation
    const settlementParams = assignmentService.calculateSettlementAmounts(paymentWithPlan || payment, 'success');
    const successRewardAmount = round2(settlementParams.successRewardAmount || (payment.amount * 0.7)); // Default 70% if calc fails
    
    const Payout = require('../payouts/payout.model');
    const existingPayout = await Payout.findOne({ payment: payment._id });
    
    if (existingPayout) {
      existingPayout.payoutAmount = successRewardAmount;
      existingPayout.payoutStatus = 'processed';
      existingPayout.processedAt = new Date();
      existingPayout.transactionId = 'SYSTEM_AUTO_RELEASE_' + payment._id.toString().slice(-6) + '_' + Date.now();
      await existingPayout.save();
    } else {
      // Fallback: Create if missing
      await payoutService.createPayout(
        payment._id,
        assignment._id,
        assignment.finder,
        successRewardAmount,
        { payoutStatus: 'processed', remarks: 'Success reward synthesized on release' }
      );
    }
  } catch (err) {
    console.error('Payout finalization failed (non-blocking):', err.message);
  }

  // Notifications
  try {
    await createNotification({
      userId: assignment.finder,
      type: 'payment',
      title: 'Payment Released!',
      message: `The owner has released your reward for "${request?.itemName}". Check your earnings.`,
      data: { assignmentId: assignment._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: payment.request,
    action: 'PAYMENT_RELEASED',
    actorUserId: userId,
    actorRole: 'owner',
    actorLabel: 'Owner',
    details: {
      paymentId: payment._id,
      amount: payment.amount,
      releaseReason: reason || '',
    },
  });

  return payment;
};

const getUserPayments = async (userId) => {
  return Payment.find({ owner: userId })
    .populate('request')
    .populate('servicePlan')
    .sort({ createdAt: -1 });
};

module.exports = {
  createPayment,
  processPayment,
  releasePayment,
  getUserPayments,
};
