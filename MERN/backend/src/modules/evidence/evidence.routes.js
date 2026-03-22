const router = require("express").Router();
const evidenceController = require("./evidence.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const { uploadEvidenceSchema } = require("./evidence.validation");
const upload = require("../../utils/fileUpload");

router.post(
	"/",
	authMiddleware,
	roleMiddleware("finder"),
	upload.any(),
	validate(uploadEvidenceSchema),
	evidenceController.uploadEvidence
);

router.post("/evidence/create", evidenceController.createEvidenceFile);
router.get("/evidences", evidenceController.getAllEvidenceFiles);
router.get("/evidence/:id", evidenceController.getEvidenceFileById);
router.put("/evidence/:id", evidenceController.updateEvidenceFileById);
router.delete("/evidence/:id", evidenceController.deleteEvidenceFileById);

router.get(
	"/:assignmentId",
	authMiddleware,
	roleMiddleware("owner"),
	evidenceController.getEvidenceForOwner
);

module.exports = router;
