const ServicePlan = require('./servicePlan.model');

/**
 * Create a new service plan
 */
const createPlan = async (planData) => {
  const { planName, refundPercent, platformPercent, finderPercent, priorityLevel, description } = planData;

  // Validate percentages (Total should not exceed 100)
  const totalPercent = (refundPercent || 0) + (platformPercent || 0) + (finderPercent || 0);
  if (totalPercent > 100) {
    throw new Error('Total percentage allocation (refund + platform + finder) cannot exceed 100%');
  }

  const plan = await ServicePlan.create({
    planName,
    refundPercent,
    platformPercent,
    finderPercent,
    priorityLevel,
    description,
  });

  return plan;
};

/**
 * Get all active service plans
 */
const getAllPlans = async () => {
  return ServicePlan.find({ isActive: true }).sort({ priorityLevel: -1 });
};

module.exports = {
  createPlan,
  getAllPlans,
};
