const payoutService = require('./payout.service');

const processPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { transactionId } = req.body;

    const payout = await payoutService.processPayout(payoutId, transactionId);

    res.status(200).json({
      success: true,
      message: 'Payout processed successfully',
      data: payout,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPayouts = async (req, res) => {
  try {
    const finderId = req.user.userId;
    const payouts = await payoutService.getPayoutsByFinder(finderId);

    res.status(200).json({
      success: true,
      message: 'Payouts retrieved successfully',
      data: payouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  processPayout,
  getMyPayouts,
};
