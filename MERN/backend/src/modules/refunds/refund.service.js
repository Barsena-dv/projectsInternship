const Payment = require('../payments/payment.model');
const LostItemRequest = require('../requests/request.model');
const { createNotification } = require('../notifications/notification.service');

/**
 * Process a partial refund based on the service plan of the payment
 */
const processRefund = async (paymentId, reason = 'Administrative refund') => {
  const payment = await Payment.findById(paymentId).populate('servicePlan');
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.paymentStatus === 'refunded') {
    throw new Error('Refund already processed for this payment');
  }

  // Calculate refund amount based on plan percentage
  const refundPercent = payment.servicePlan?.refundPercent || 0;
  const refundAmount = (payment.amount * refundPercent) / 100;

  payment.paymentStatus = 'refunded';
  payment.refundAmount = refundAmount;
  payment.refundStatus = 'completed';
  payment.refundReason = reason;
  await payment.save();

  // Update associated request status to 'cancelled' if applicable
  const request = await LostItemRequest.findById(payment.request);
  if (request && ['pending_payment', 'open', 'assigned'].includes(request.requestStatus)) {
    request.requestStatus = 'cancelled';
    await request.save();
  }

  // Notify owner
  try {
    await createNotification({
      userId: payment.owner,
      type: 'payment',
      title: 'Refund Processed',
      message: `A partial refund of ₹${refundAmount.toFixed(2)} (${refundPercent}%) has been processed for your request: "${request?.itemName || 'your item'}".`,
      data: { paymentId, requestId: payment.request },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return payment;
};

module.exports = {
  processRefund,
};
