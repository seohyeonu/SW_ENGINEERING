const express = require('express');
const http = require('http'); // 추가
const { Server } = require('socket.io'); // 추가
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const setupChatSocket = require('./socket/chatSocket');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const taskcommentRoutes = require('./routes/taskcommentRoutes');
const announcementcommentRoutes = require('./routes/announcementcommentRoutes');
const logRoutes = require('./routes/logRoutes');
const notificationRoutes = require('./routes/notification');

const app = express();
const server = http.createServer(app); // 서버 래핑

// 알림용 소켓 서버 설정
const notificationIo = new Server(server, {
    path: '/notification',
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 알림 소켓 연결 처리
notificationIo.on('connection', (socket) => {
    console.log('📡 알림 소켓 연결됨:', socket.id);

    socket.on('register', (userId) => {
        console.log(`👤 알림 사용자 등록됨: user-${userId}`);
        socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ 알림 소켓 연결 해제:', socket.id);
    });
});

// 채팅용 소켓 서버 설정
const chatIo = setupChatSocket(server);

// Express 전역에서 소켓 접근 가능하게 설정
app.set('notificationIo', notificationIo);
app.set('chatIo', chatIo);

// 미들웨어 설정
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Passport 설정
require('./config/passport');
app.use(passport.initialize());

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', taskcommentRoutes);
app.use('/api/announcementcomments', announcementcommentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

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
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// 서버 시작
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
