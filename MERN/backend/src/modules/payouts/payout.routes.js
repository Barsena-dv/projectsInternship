const router = require("express").Router();
const payoutController = require("./payout.controller");

router.post("/payout/create", payoutController.createPayout);
router.get("/payouts", payoutController.getAllPayouts);
router.get("/payout/:id", payoutController.getPayoutById);
router.put("/payout/:id", payoutController.updatePayout);
router.delete("/payout/:id", payoutController.deletePayout);

module.exports = router;