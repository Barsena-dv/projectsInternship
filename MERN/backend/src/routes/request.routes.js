const router = require("express").Router();
const requestController = require("../controllers/request.controller");
const protect = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.post("/",protect,upload.array("images", 5),requestController.createRequest);
router.get("/my", protect, requestController.getMyRequests);
router.get("/", protect, requestController.getNearbyRequests);
router.get("/:id", protect, requestController.getRequestById);
router.put("/:id", protect, requestController.updateRequest);
router.delete("/:id", protect, requestController.deleteRequest);
router.patch("/:id/status", protect, requestController.updateRequestStatus);

module.exports = router;