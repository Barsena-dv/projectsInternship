const router = require("express").Router();
const paymentController = require("./payment.controller");

router.post("/payment/create", paymentController.createPayment);
router.get("/payments", paymentController.getAllPayments);
router.get("/payment/:id", paymentController.getPaymentById);
router.put("/payment/:id", paymentController.updatePayment);
router.delete("/payment/:id", paymentController.deletePayment);

module.exports = router;
