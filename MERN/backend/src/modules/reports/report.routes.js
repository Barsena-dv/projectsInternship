const router = require("express").Router();
const reportController = require("./report.controller");

router.post("/report", reportController.createReport);
router.get("/reports", reportController.getAllReports);
router.get("/report/:id", reportController.getReportById);
router.put("/report/:id", reportController.updateReport);
router.delete("/report/:id", reportController.deleteReport);

module.exports = router;