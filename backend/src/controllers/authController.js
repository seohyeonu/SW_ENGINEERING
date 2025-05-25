const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// JWT 비밀키 
const JWT_SECRET = process.env.JWT_SECRET;

// 전화번호 포맷팅 함수
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // 숫자만 추출
    const numbers = phone.replace(/[^0-9]/g, '');
    
    // 11자리 전화번호 형식으로 변환 (010-XXXX-XXXX)
    if (numbers.length === 11) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    
    return phone; // 형식이 맞지 않으면 원본 반환
};

class AuthController {
    // 회원가입
    async register(req, res) {
        try {
            const { name, username, email, password, phone, department } = req.body;

            // 필수 필드 검증
            if (!name || !username || !password) {
                return res.status(400).json({
                    success: false,
                    message: '필수 정보를 모두 입력해주세요.'
                });
            }

            // 사용자 중복 확인
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '이미 사용 중인 사용자명입니다.'
                });
            }

            // 사용자 생성
            const user = await User.create({
                name,       // 이름
                username,   // 사용자명
                email,      // 이메일
                password,   // 비밀번호
                phone,
                department
            });

            // 비밀번호를 제외한 사용자 정보 반환
            res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다.',
                user: user.toJSON()
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }

    // 로그인
    async login(req, res) {
        try {
            console.log('Login attempt with:', req.body);
            const { username, password } = req.body;

            // 필수 필드 검증
            if (!username || !password) {
                console.log('Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: '아이디와 비밀번호를 입력해주세요.'
                });
            }

            // 사용자 찾기
            console.log('Finding user:', username);
            const user = await User.findByUsername(username);
            console.log('Found user:', user ? 'Yes' : 'No');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 잘못되었습니다.'
                });
            }

            // 비밀번호 검증
            console.log('Validating password');
            const isValidPassword = await user.comparePassword(password);
            console.log('Password valid:', isValidPassword);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 잘못되었습니다.'
                });
            }

            // 로그인 성공 - 상태 업데이트
            console.log('Updating user status to online');
            await user.updateStatus('online');

            // 사용자 데이터를 전체 필드와 함께 응답
            const userData = {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                name: user.name,
                phone: formatPhoneNumber(user.phone), // 전화번호 포맷팅 적용
                department: user.department,
                status: 'online',  // 로그인 시 상태를 'online'으로 설정
                created_at: user.created_at
            };

            console.log('Sending user data:', userData);

            // 토큰 생성 및 응답
            const token = jwt.sign(
                { id: user.user_id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 24 * 60 * 60 * 1000 // 24시간
            });

            res.status(200).json({
                success: true,
                message: '로그인 성공',
                token,
                user: userData  // 수정된 사용자 데이터 형식
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: '로그인 처리 중 오류가 발생했습니다.'
            });
        }
    }

    // 로그아웃
    async logout(req, res) {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: '사용자 정보가 필요합니다.'
                });
            }

            const user = await User.findByUsername(username);
            if (user) {
                await user.updateStatus('offline');
            }

            // 쿠키 삭제
            res.clearCookie('token');

            res.json({
                success: true,
                message: '로그아웃 되었습니다.'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }

    // 프로필 조회
    async getProfile(req, res) {
        try {
            const { username } = req.query;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: '사용자 정보가 필요합니다.'
                });
            }

            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }

            res.json({
                success: true,
                user: user.toJSON()
            });

        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }

    // 프로필 수정
    async updateProfile(req, res) {
        try {
            const { username } = req.query;
            const { name, email, phone, department } = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: '사용자 정보가 필요합니다.'
                });
            }

            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }

            await user.update({ name, email, phone, department });

            res.json({
                success: true,
                message: '프로필이 업데이트되었습니다.',
                user: user.toJSON()
            });

        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }
    async oauthCallback(req, res) {
    // Passport에서 세팅한 req.user
    const token = jwt.sign(
      { userId: req.user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // 쿠키에 토큰 저장 (혹은 JSON으로 반환)
    res.cookie('token', token, { httpOnly: true });
    return res.redirect('http://localhost:5173');
  }

    // 2025.05.25 오후 5시 10분 추가
    // 현재 비밀번호 검증
    async verifyPassword(req, res) {
    try {
        const userId = req.user?.id;
        const { currentPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });

        return res.json({ success: true, message: '비밀번호 확인 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
    }

    // 새 비밀번호 변경
    async changePassword(req, res) {
    try {
        const userId = req.user?.id;
        const { newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(userId, hashed);

        return res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
    }

}

module.exports = new AuthController();
