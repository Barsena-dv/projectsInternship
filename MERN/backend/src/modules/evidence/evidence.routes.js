const router = require("express").Router();
const evidenceController = require("./evidence.controller");

router.post("/evidence/create", evidenceController.createEvidenceFile);
router.get("/evidences", evidenceController.getAllEvidenceFiles);
router.get("/evidence/:id", evidenceController.getEvidenceFileById);
router.put("/evidence/:id", evidenceController.updateEvidenceFileById);
router.delete("/evidence/:id", evidenceController.deleteEvidenceFileById);

module.exports = router;
