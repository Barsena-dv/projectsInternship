const Payment = require('./payment.model');
const LostItemRequest = require('../requests/request.model');
const FinderAssignment = require('../assignments/assignment.model');
const ServicePlan = require('../servicePlans/servicePlan.model');
const Conversation = require('../chat/conversation.model');
const { createNotification } = require('../notifications/notification.service');
const payoutService = require('../payouts/payout.service');

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

  // CRITICAL: Unlock request for finders
  const request = await LostItemRequest.findById(payment.request);
  if (request) {
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

  if (payment.paymentStatus !== 'locked') {
    throw new Error(`Cannot release payment in ${payment.paymentStatus} state`);
  }

  // Find active assignment
  const assignment = await FinderAssignment.findOne({
    request: payment.request,
    status: 'active',
  });

  if (!assignment) throw new Error('No active assignment found to release funds to');

  // CRITICAL VALIDATIONS
  if (!assignment.evidenceVerified) {
    throw new Error('Verification required: You must verify the finder\'s proof before releasing payment');
  }

  if (assignment.isDisputed) {
    throw new Error('Payment blocked: Cannot release funds while an active dispute exists');
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

  // Trigger Payout Record (Internal system transfer)
  try {
    const plan = await ServicePlan.findById(payment.servicePlan);
    const finderReward = (payment.amount * (plan?.finderPercent || 90)) / 100;
    
    await payoutService.createPayout(
      payment._id,
      assignment._id,
      assignment.finder,
      finderReward
    );
  } catch (err) {
    console.error('Payout creation failed:', err.message);
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

  return payment;
};

const getUserPayments = async (userId) => {
  return Payment.find({ owner: userId })
    .populate('request')
    .sort({ createdAt: -1 });
};

module.exports = {
  createPayment,
  processPayment,
  releasePayment,
  getUserPayments,
};
