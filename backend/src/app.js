const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const crypto = require('crypto');

const app = express();

//미들웨어 설정
app.use(cors({
    origin: 'http://localhost:5173', // Vite 개발 서버
    credentials: true
}));
app.use(bodyParser.json());

//회원가입 api
app.post('/api/register', async (req, res) => {
    const { username, email, password, password_check } = req.body;
    
    console.log('Received registration data:', {
        username,
        email,
        password: password ? 'exists' : 'undefined',
        password_check: password_check ? 'exists' : 'undefined'
    });

    // 입력값 검증
    if (!username || !email || !password || !password_check) {
        return res.status(400).json({
            success: false,
            message: '모든 필드를 입력해주세요.'
        });
    }

    try {
        // 1. 이메일 중복 확인
        const [existingUsers] = await pool.query(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        // 비밀번호 일치 확인
        if (password !== password_check) {
            return res.status(400).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            });
        }

        // 2. 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        //3. 사용자 user_id 생성(고유 식별자 생성)
        const userId = crypto.randomBytes(16).toString('hex');

        console.log('Processing registration:', {
            userId,
            hashedPassword: hashedPassword ? 'created' : 'failed'
        });

        // 4. 새 사용자 추가
        await pool.query(
            'INSERT INTO user (user_id, password, name, email) VALUES (?, ?, ?, ?)',
            [userId, hashedPassword, username, email]
        );

        res.json({
            success: true,
            message: '회원가입이 완료되었습니다.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

//로그인 api
app.post('/api/login', async (req, res) => {
    //1. 프론트에서 http로 보낸 요청을 가져오기
    const email = req.body.email;
    const password = req.body.password;
    
    console.log(`backend user_email: ${email}, user_password: ${password}`);

    try {
        // 2. 데이터베이스에서 사용자 찾기
        const [users] = await pool.query(
            'SELECT * FROM user WHERE email = ?',
            [email] // 프론트엔드에서 보낸 username이 실제로는 이메일
        );

        // 3. 사용자가 존재하지 않는 경우
        if (users.length === 0) {
            return res.json({
                success: false,
                message: '로그인 실패, 아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        const user = users[0];
        console.log(`DB에서 가져온 로그인 사용자: 이름 : ${user.name}, 이메일(로그인 아이디) : ${user.email}, 비밀번호 : ${user.password}, user_id : ${user.user_id}`);

        // 4. 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: '로그인 실패, 아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        // 5. 사용자 상태를 online으로 업데이트
        await pool.query(
            'UPDATE user SET status = ? WHERE user_id = ?',
            ['online', user.user_id]
        );

        // 업데이트된 사용자 정보 다시 조회
        const [updatedUsers] = await pool.query(
            'SELECT * FROM user WHERE user_id = ?',
            [user.user_id]
        );
        const updatedUser = updatedUsers[0];

        console.log(`DB 업데이트 확인, 이메일(로그인 아이디) : ${updatedUser.email}, user_id : ${updatedUser.user_id}, status : ${updatedUser.status}`);

        // 6. 로그인 성공
        res.json({
            success: true,
            message: '로그인 성공',
            user: {
                id: updatedUser.user_id,
                username: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});



//로그아웃 api -> db에 접근해서 사용자 상태를 offline으로 업데이트
app.post('/api/logout', async (req, res) => {
    try {
        const email = req.body.email;  // 프론트엔드에서 전달받은 이메일
        console.log('로그아웃 요청된 이메일:', email);

        if (email) {
            // 사용자 상태를 offline으로 업데이트
            await pool.query(
                'UPDATE user SET status = ? WHERE email = ?',
                ['offline', email]
            );

            console.log('사용자 상태 업데이트 완료:', email);
        }

        res.json({
            success: true,
            message: '로그아웃 성공'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: '로그아웃 중 오류가 발생했습니다.'
        });
    }
});

//포트 설정
const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});