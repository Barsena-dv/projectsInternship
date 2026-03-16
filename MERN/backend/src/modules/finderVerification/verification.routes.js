const router = require("express").Router();
const verificationController = require("./verification.controller");

router.post("/verification", verificationController.createFinderVerification);
router.get("/verifications", verificationController.getAllFinderVerifications);
router.get("/verification/:id", verificationController.getFinderVerificationById);
router.put("/verification/:id", verificationController.updateFinderVerificationById);
router.delete("/verification/:id", verificationController.deleteFinderVerificationById);

module.exports = router;
