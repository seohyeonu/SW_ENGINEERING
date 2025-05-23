const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// JWT 비밀키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 인증 미들웨어
 * - JWT 토큰을 검증하고 사용자 정보를 요청 객체에 추가
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 쿠키에서 토큰 가져오기
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 없습니다.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = {
            id: decoded.id,
            username: decoded.username
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.',
            error: error.message
        });
    }
};

module.exports = authMiddleware;
