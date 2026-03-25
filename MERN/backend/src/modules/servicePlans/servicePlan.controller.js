const servicePlanService = require('./servicePlan.service');

/**
 * Admin: Create a new service plan
 */
const createPlan = async (req, res) => {
  try {
    const plan = await servicePlanService.createPlan(req.body);

    res.status(201).json({
      success: true,
      message: 'Service plan created successfully',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all active service plans
 */
const getAllPlans = async (req, res) => {
  try {
    const plans = await servicePlanService.getAllPlans();

    res.status(200).json({
      success: true,
      message: 'Service plans retrieved successfully',
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
};
