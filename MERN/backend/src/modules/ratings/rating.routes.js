const router = require("express").Router();
const ratingController = require("./rating.controller");

router.post("/rating", ratingController.createRating);
router.get("/ratings", ratingController.getAllRatings);
router.get("/rating/:id", ratingController.getRatingById);
router.put("/rating/:id", ratingController.updateRating);
router.delete("/rating/:id", ratingController.deleteRating);

module.exports = router;