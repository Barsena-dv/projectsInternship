const ServicePlan = require('./servicePlan.model');

exports.getAllActivePlans = async () => {
    return await ServicePlan.find({ isActive: true });
};
