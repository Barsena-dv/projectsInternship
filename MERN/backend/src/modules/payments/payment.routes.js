const router = require("express").Router();
const paymentController = require("./payment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

router.post(
	"/",
	authMiddleware,
	roleMiddleware("owner"),
	paymentController.lockPayment
);

router.post("/payment/create", paymentController.createPayment);
router.get("/payments", paymentController.getAllPayments);
router.get("/payment/:id", paymentController.getPaymentById);
router.put("/payment/:id", paymentController.updatePayment);
router.delete("/payment/:id", paymentController.deletePayment);

module.exports = router;
