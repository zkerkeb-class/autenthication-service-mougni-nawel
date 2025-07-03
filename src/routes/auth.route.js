const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', authController.loginController);
router.post('/register', authController.registerController);
router.post('/logout', authMiddleware, authController.logoutController);
router.get('/me', authMiddleware, authController.meController);

module.exports = router;
