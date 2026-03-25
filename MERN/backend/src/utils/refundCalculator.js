/**
 * Calculate refund amount based on service plan and duration
 */
const calculateRefund = (originalAmount, servicePlanRefundPercentage) => {
  const refundAmount = (originalAmount * servicePlanRefundPercentage) / 100;
  return Math.round(refundAmount * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate platform fee
 * @param {Number} rewardAmount - Reward amount
 * @param {Number} platformFeePercentage - Platform fee as percentage
 */
const calculatePlatformFee = (rewardAmount, platformFeePercentage = 10) => {
  const fee = (rewardAmount * platformFeePercentage) / 100;
  return Math.round(fee * 100) / 100;
};

/**
 * Calculate net payout for finder
 */
const calculateNetPayout = (rewardAmount, platformFeePercentage = 10) => {
  const fee = calculatePlatformFee(rewardAmount, platformFeePercentage);
  const netAmount = rewardAmount - fee;
  return {
    rewardAmount,
    platformFee: fee,
    netAmount: Math.round(netAmount * 100) / 100,
  };
};

/**
 * Determine if refund is eligible
 * @param {String} reason - Reason for refund
 * @param {Date} expiryDate - Request expiry date
 */
const isRefundEligible = (reason, expiryDate) => {
  const eligibleReasons = ['item_not_found', 'owner_cancelled', 'not_confirmed'];
  const isExpired = new Date() > expiryDate;

  return eligibleReasons.includes(reason) && isExpired;
};

module.exports = {
  calculateRefund,
  calculatePlatformFee,
  calculateNetPayout,
  isRefundEligible,
};
