const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// 인증 관련 라우트들 (authController 사용)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// 사용자 프로필 조회 라우트 (userController 사용)
router.get('/profile', authMiddleware, userController.getUserProfile);

module.exports = router; 