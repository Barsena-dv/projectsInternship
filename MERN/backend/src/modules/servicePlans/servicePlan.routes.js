const router = require("express").Router();
const servicePlanController = require("./servicePlan.controller");

router.post("/service", servicePlanController.createServicePlan);
router.get("/services", servicePlanController.getAllServicePlans);
router.get("/service/:id", servicePlanController.getServicePlanById);
router.put("/service/:id", servicePlanController.updateServicePlanById);
router.delete("/service/:id", servicePlanController.deleteServicePlanById);

module.exports = router;
