const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Frontend URL from environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 인증 관련 라우트
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// 프로필 관련 라우트
router.get('/profile', authController.getProfile.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));



// 2025.05.25 오후 5시 10분 추가
const requireAuth = require('../middleware/authMiddleware');

router.post('/verify-password', requireAuth, authController.verifyPassword.bind(authController));
router.post('/change-password', requireAuth, authController.changePassword.bind(authController));

// 추가 끝


//구글 소셜 로그인
//2025.05.31 서현우 sns 로그인 구현

// 1) 구글 OAuth 진입점
router.get(
    '/google',
    passport.authenticate('google', { session: false, scope: ['email', 'profile'] })
  );


// 2) 구글 OAuth 콜백 처리 (로컬 로그인과 동일한 JSON 응답)
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
      try {
        console.log('[OAuth][Google] 콜백 완료, User:', req.user.user_id);
  
        // 1) 상태 업데이트
        await req.user.updateStatus('online');
  
        // 2) JWT 발급
        const token = jwt.sign(
          { id: req.user.user_id, username: req.user.username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
  
        // 3) 응답에 사용할 사용자 데이터 가공
        const userData = {
          user_id: req.user.user_id,
          username: req.user.username,
          email: req.user.email,
          name: req.user.name,
          phone: req.user.phone,
          department: req.user.department,
          status: req.user.status,
          created_at: req.user.created_at,
          profile_image: req.user.profile_image,
          oauth_provider: req.user.oauth_provider
        };
  
        // Build query parameters including token and userData fields
        const params = new URLSearchParams({
          token,
          ...userData,
          user_id: String(userData.user_id),
          created_at: userData.created_at instanceof Date
            ? userData.created_at.toISOString()
            : userData.created_at,
          profile_image: userData.profile_image || '',
          oauth_provider: userData.oauth_provider || 'local'
        });
  
        return res.redirect(`${FRONTEND_URL}/oauth-callback?${params.toString()}`);
      } catch (err) {
        console.error('[OAuth][Google] 처리 오류:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
    }
  );
  

// 3) 깃허브 OAuth 진입점
router.get(
    '/github',
    passport.authenticate('github', { session: false, scope: ['user:email'] })
  );
  
  // 4) 깃허브 OAuth 콜백 처리 (동일 포맷)
router.get(
    '/github/callback',
    passport.authenticate('github', { session: false }),
    async (req, res) => {
      try {
        console.log('[OAuth][GitHub] 콜백 완료, User:', req.user.user_id);
        await req.user.updateStatus('online');
  
        const token = jwt.sign(
          { id: req.user.user_id, username: req.user.username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
  
        const userData = {
          user_id:   req.user.user_id,
          username:  req.user.username,
          email:     req.user.email,
          name:      req.user.name,
          phone:     req.user.phone,
          department:req.user.department,
          status:    req.user.status,
          created_at:req.user.created_at
        };
  
        // Build query parameters including token and userData fields
        const params = new URLSearchParams({
          token,
          user_id: String(userData.user_id),
          username: userData.username,
          email: userData.email || '',
          name: userData.name,
          phone: userData.phone || '',
          department: userData.department || '',
          status: userData.status,
          created_at: userData.created_at instanceof Date
            ? userData.created_at.toISOString()
            : userData.created_at
        });
  
        return res.redirect(`${FRONTEND_URL}/oauth-callback?${params.toString()}`);
      } catch (err) {
        console.error('[OAuth][GitHub] 처리 오류:', err);
        return res.status(500).json({ success: false, message: 'OAuth 로그인 처리 중 오류가 발생했습니다.' });
      }
    }
  );








module.exports = router;