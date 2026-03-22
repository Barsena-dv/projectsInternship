const router = require("express").Router();
const requestController = require("./request.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
	createRequestSchema,
	updateRequestSchema,
} = require("./request.validation");

router.post(
	"/",
	authMiddleware,
	roleMiddleware("owner"),
	validate(createRequestSchema),
	requestController.createRequest
);
router.get(
	"/my",
	authMiddleware,
	roleMiddleware("owner"),
	requestController.getOwnerRequests
);
router.put(
	"/:id",
	authMiddleware,
	roleMiddleware("owner"),
	validate(updateRequestSchema),
	requestController.updateRequest
);
router.patch(
	"/:id/publish",
	authMiddleware,
	roleMiddleware("owner"),
	requestController.publishRequest
);
router.get(
	"/open",
	authMiddleware,
	roleMiddleware("finder"),
	requestController.getOpenRequests
);

router.post("/request/create", requestController.createLostItemRequest);
router.get("/requests", requestController.getAllLostItemRequests);
router.get("/request/:id", requestController.getLostItemRequestById);
router.put("/request/:id", requestController.updateLostItemRequestById);
router.delete("/request/:id", requestController.deleteLostItemRequestById);

module.exports = router;
