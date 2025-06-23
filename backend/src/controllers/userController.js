const User = require('../models/userModel');

// 사용자 프로필 조회
const getUserProfile = async (req, res) => {
    try {
        // JWT 토큰에서 user_id 추출 (미들웨어에서 설정됨)
        const userId = req.user.user_id;
        console.log('Backend - 요청된 user_id:', userId);
        console.log('Backend - JWT 토큰 정보:', req.user);
        
        // findById 함수를 사용하여 사용자 정보 조회
        const user = await User.findById(userId);
        console.log('Backend - 조회된 사용자 정보:', user);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 클라이언트에 필요한 정보만 선택하여 반환
        const responseData = {
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                job_position: user.department,
                description: user.description
            }
        };
        console.log('Backend - 클라이언트로 보내는 응답:', responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Backend - 프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '프로필 정보를 가져오는 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    // ... existing exports ...
    getUserProfile
}; 