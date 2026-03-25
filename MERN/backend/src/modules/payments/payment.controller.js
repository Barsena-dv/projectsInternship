const paymentService = require('./payment.service');

const createPayment = async (req, res) => {
  try {
    const { requestId, servicePlanId, amount, paymentMethod } = req.body;
    const userId = req.user.userId;

    const payment = await paymentService.createPayment(
      userId,
      requestId,
      servicePlanId,
      amount,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      message: 'Payment record created. Proceed to processing.',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new Error('Transaction ID is required to process payment');
    }

    const payment = await paymentService.processPayment(paymentId, transactionId);

    res.status(200).json({
      success: true,
      message: 'Payment secured in escrow. Request is now live.',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const releasePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const payment = await paymentService.releasePayment(paymentId, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Payment released and task completed',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user.userId);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  processPayment,
  releasePayment,
  getUserPayments,
};
