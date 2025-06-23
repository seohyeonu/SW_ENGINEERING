const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// JWT 비밀키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 인증 미들웨어
 * - 쿠키의 JWT 토큰을 검증하고 사용자 정보를 요청 객체에 추가
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 쿠키에서 토큰 가져오기
        const token = req.cookies.token;
        console.log('Backend - 쿠키에서 토큰 확인:', token ? '토큰 존재' : '토큰 없음');
        
        if (!token) {
            console.log('Backend - 토큰이 없습니다.');
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        console.log('Backend - 토큰 검증 중...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Backend - 토큰 디코딩 결과:', decoded);
        
        // 두 가지 필드 모두 설정하여 호환성 보장
        req.user = {
            id: decoded.id,           // TaskController에서 사용
            user_id: decoded.id,      // UserController에서 사용
            username: decoded.username
        };
        
        console.log('Backend - req.user 설정:', req.user);
        next();
    } catch (error) {
        console.error('Backend - 토큰 검증 오류:', error);
        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.',
            error: error.message
        });
    }
};

module.exports = authMiddleware;
