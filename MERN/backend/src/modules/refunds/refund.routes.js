const router = require("express").Router();
const refundController = require("./refund.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

router.post(
	"/",
	authMiddleware,
	roleMiddleware("admin", "system"),
	refundController.processRefund
);

router.post("/refund/create", refundController.createRefund);
router.get("/refunds", refundController.getAllRefunds);
router.get("/refund/:id", refundController.getRefundById);
router.put("/refund/:id", refundController.updateRefund);
router.delete("/refund/:id", refundController.deleteRefund);

module.exports = router;