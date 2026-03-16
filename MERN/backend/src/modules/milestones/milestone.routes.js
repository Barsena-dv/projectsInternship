const router = require("express").Router();
const milestoneController = require("./milestone.controller");

router.post("/milestone/create", milestoneController.createMilestone);
router.get("/milestones", milestoneController.getAllMilestones);
router.get("/milestone/:id", milestoneController.getMilestoneById);
router.put("/milestone/:id", milestoneController.updateMilestoneById);
router.delete("/milestone/:id", milestoneController.deleteMilestoneById);

module.exports = router;
