const Payout = require('./payout.model');
const Payment = require('../payments/payment.model');
const FinderAssignment = require('../assignments/assignment.model');
const { createNotification } = require('../notifications/notification.service');

/**
 * Automatically create a payout record when a payment is released
 */
const createPayout = async (paymentId, assignmentId, finderId, amount) => {
  const payout = await Payout.create({
    finder: finderId,
    assignment: assignmentId,
    payment: paymentId,
    payoutAmount: amount,
    payoutStatus: 'pending',
  });

  return payout;
};

/**
 * Process the actual payout (transfer of funds)
 */
const processPayout = async (payoutId, transactionId) => {
  const payout = await Payout.findById(payoutId).populate('assignment').populate('payment');
  if (!payout) {
    throw new Error('Payout record not found');
  }

  // VALIDATIONS
  if (payout.payoutStatus === 'processed') {
    throw new Error('Payout already processed');
  }

  if (payout.payment.paymentStatus !== 'released') {
    throw new Error('Payment must be released before processing payout');
  }

  if (payout.assignment.status !== 'completed') {
    throw new Error('Assignment must be completed before processing payout');
  }

  payout.payoutStatus = 'processed';
  payout.processedAt = new Date();
  payout.transactionId = transactionId;
  await payout.save();

  // Notify finder
  try {
    await createNotification({
      userId: payout.finder,
      type: 'payment',
      title: 'Payout Processed',
      message: `Your reward of ₹${payout.payoutAmount.toFixed(2)} has been successfully transferred to your account.`,
      data: { payoutId: payout._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return payout;
};

const getPayoutsByFinder = async (finderId) => {
  return Payout.find({ finder: finderId }).sort({ createdAt: -1 });
};

module.exports = {
  createPayout,
  processPayout,
  getPayoutsByFinder,
};
