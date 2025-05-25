const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const passport = require('./config/passport');
const projectRoutes = require('./routes/projectRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// 미들웨어 설정
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api', taskRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: err.message
    });
});

// 404 처리
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url); // 요청 로깅 추가
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;