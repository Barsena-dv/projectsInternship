const router = require('express').Router();
const userController = require('./user.controller');

router.post('/register', userController.registerUser);
router.post('/login', userController.userLogin);

module.exports = router;