const router = require("express").Router();
const authController = require("./auth.controller");
const validate = require("../../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("./auth.validation");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
