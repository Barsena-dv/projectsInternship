const ServicePlan = require('../modules/servicePlans/servicePlan.model');

/**
 * Seed default service plans if none exist
 */
const seedDefaultPlans = async () => {
  try {
    const count = await ServicePlan.countDocuments();
    if (count > 0) {
      console.log('✅ Service plans already exist. Skipping seeding.');
      return;
    }

    const defaultPlans = [
      {
        planName: 'Explorer (Free)',
        refundPercent: 100,
        platformPercent: 0,
        finderPercent: 0,
        price: 0,
        priorityLevel: 1,
        description: 'Standard discovery for non-urgent lost items. Basic platform priority.',
      },
      {
        planName: 'Standard Discovery',
        refundPercent: 90,
        platformPercent: 5,
        finderPercent: 5,
        price: 50,
        priorityLevel: 2,
        description: 'Enhanced visibility. Small reward pool for finders to accelerate recovery.',
      },
      {
        planName: 'Elite Recovery',
        refundPercent: 80,
        platformPercent: 5,
        finderPercent: 15,
        price: 150,
        priorityLevel: 3,
        description: 'Maximum platform exposure and high finder incentive for critical lost property.',
      }
    ];

    await ServicePlan.insertMany(defaultPlans);
    console.log('🚀 Default service plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding service plans:', error.message);
  }
};

module.exports = { seedDefaultPlans };
