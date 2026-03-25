const refundService = require('./refund.service');

const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const refund = await refundService.processRefund(paymentId, reason);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  processRefund,
};
