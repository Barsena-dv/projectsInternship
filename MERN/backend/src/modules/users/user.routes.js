const router = require('express').Router();
const userController = require('./user.controller');

// router.post('/register', userController.registerUser);
// router.post('/login', userController.userLogin);

router.post('/user', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/user/:id', userController.getUserById);
router.put('/user/:id', userController.updateUserById);
router.delete('/user/:id', userController.deleteUserById);

module.exports = router;