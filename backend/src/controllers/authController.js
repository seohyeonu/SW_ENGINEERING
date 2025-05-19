const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// JWT 비밀키 
const JWT_SECRET = process.env.JWT_SECRET;

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

            // JWT 토큰 생성
            const token = jwt.sign(
                { 
                    id: user.user_id,
                    username: user.username
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 쿠키에 토큰 저장
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24시간
            });

            const userData = user.toJSON();
            console.log('Sending user data:', userData);

            res.json({
                success: true,
                message: '로그인 성공',
                user: userData
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
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
}

module.exports = new AuthController();
