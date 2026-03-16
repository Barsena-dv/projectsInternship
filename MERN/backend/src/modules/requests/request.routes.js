const router = require("express").Router();
const requestController = require("./request.controller");

router.post("/request/create", requestController.createLostItemRequest);
router.get("/requests", requestController.getAllLostItemRequests);
router.get("/request/:id", requestController.getLostItemRequestById);
router.put("/request/:id", requestController.updateLostItemRequestById);
router.delete("/request/:id", requestController.deleteLostItemRequestById);

module.exports = router;
