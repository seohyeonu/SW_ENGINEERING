const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 인증 관련 라우트
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// 프로필 관련 라우트
router.get('/profile', authController.getProfile.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));

module.exports = router;