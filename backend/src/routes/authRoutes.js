const express = require('express');
const passport = require('../config/passport');
const router = express.Router();
const authController = require('../controllers/authController');


// 인증 관련 라우트
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// 프로필 관련 라우트
router.get('/profile', authController.getProfile.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  authController.oauthCallback
);

// GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  authController.oauthCallback
);

// 2025.05.25 오후 5시 10분 추가
const requireAuth = require('../middleware/authMiddleware');

router.post('/verify-password', requireAuth, authController.verifyPassword.bind(authController));
router.post('/change-password', requireAuth, authController.changePassword.bind(authController));

// 추가 끝


module.exports = router;