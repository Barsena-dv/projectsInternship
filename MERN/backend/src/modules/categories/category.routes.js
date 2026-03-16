const router = require("express").Router();
const categoryController = require("./category.controller");

router.post("/product", categoryController.createCategory);
router.get("/products", categoryController.getAllCategories);
router.get("/product/:id", categoryController.getCategoryById);
router.put("/product/:id", categoryController.updateCategoryById);
router.delete("/product/:id", categoryController.deleteCategoryById);

module.exports = router;
