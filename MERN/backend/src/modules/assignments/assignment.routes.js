const router = require("express").Router();
const assignmentController = require("./assignment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

router.post(
	"/:requestId/accept",
	authMiddleware,
	roleMiddleware("finder"),
	assignmentController.acceptAssignment
);

router.patch(
	"/:id/confirm",
	authMiddleware,
	roleMiddleware("owner"),
	assignmentController.ownerReviewEvidence
);

router.post("/assignment/create", assignmentController.createFinderAssignment);
router.get("/assignments", assignmentController.getAllFinderAssignments);
router.get("/assignment/:id", assignmentController.getFinderAssignmentById);
router.put("/assignment/:id", assignmentController.updateFinderAssignmentById);
router.delete("/assignment/:id", assignmentController.deleteFinderAssignmentById);

module.exports = router;