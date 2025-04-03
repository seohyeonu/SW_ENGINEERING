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
app.post('/api/login', (req, res) => {
    //1. 프론트에서 http로 보낸 요청을 가져오기
    const username = req.body.username;
    const password = req.body.password;
    
    console.log(username, password);

    //2. 사용자 인증
    const user = users.find(function(user){
        if(user.username === username && user.password === password) {
            return true;
        }
        else{
            return false;
        }
    })
    
    if(user){
        res.json({
            success: true,
            message: '로그인 성공',
        });
    }
    else{
        res.json({
            success: false,
            message: '로그인 실패, 아이디 또는 비밀번호가 잘못 되었습니다.',
        });
    }
})

const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    
    // 정적 파일 제공 경로 수정 (frontend 폴더 전체를 정적으로 제공)
    app.use(express.static(path.join(__dirname, '../../frontend')));
    
    // 라우트 추가
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/login.html'));
    });
    
    app.get('/main', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/main.html'));
    });
});