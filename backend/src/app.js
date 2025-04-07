const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const crypto = require('crypto');

const app = express();

//미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

//회원가입 api
app.post('/api/register', async (req, res) => {
    const { username, email, password, password_check } = req.body;
    
    console.log(username, email, password, password_check);
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

        // 2. 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        //3. 사용자 user_id 생성(고유 식별자 생성)
        const userId = crypto.randomBytes(16).toString('hex');

        console.log(`hashedPassword: ${hashedPassword}`);
        console.log(`user_id: ${userId}`);

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
    
    console.log(`backend username: ${email}, password: ${password}`);

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

const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    
    // 정적 파일 제공 경로 수정 (frontend 폴더 전체를 정적으로 제공)
    app.use(express.static(path.join(__dirname, '../../frontend')));
    
    // 라우트 추가
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/main.html'));
    });
    
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/login.html'));
    });
});