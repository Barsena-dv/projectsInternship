const router = require("express").Router();
const assignmentController = require("./assignment.controller");

router.post("/assignment/create", assignmentController.createFinderAssignment);
router.get("/assignments", assignmentController.getAllFinderAssignments);
router.get("/assignment/:id", assignmentController.getFinderAssignmentById);
router.put("/assignment/:id", assignmentController.updateFinderAssignmentById);
router.delete("/assignment/:id", assignmentController.deleteFinderAssignmentById);

module.exports = router;