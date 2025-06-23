const { Server } = require('socket.io');

function setupChatSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // 활성 소켓 연결 저장
    const activeUsers = new Map();

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        console.log('💬 채팅 소켓 연결됨:', {
            socketId: socket.id,
            userId: userId
        });

        // 사용자 채팅방 등록
        socket.on('register', (userId) => {
            console.log(`👤 채팅 사용자 등록됨: user-${userId}`);
            activeUsers.set(userId, socket.id);
            socket.join(`user-${userId}`);
            
            // 현재 활성 사용자 목록 로깅
            console.log('현재 활성 사용자:', Array.from(activeUsers.entries()));
        });

        // 채팅 메시지 처리
        socket.on('send_message', async (data) => {
            try {
                const { targetUserId, message, timestamp } = data;
                const senderId = socket.handshake.query.userId;
                
                console.log('💬 메시지 전송 시도:', {
                    from: senderId,
                    to: targetUserId,
                    message,
                    timestamp
                });

                // 수신자의 소켓 ID 확인
                const targetSocketId = activeUsers.get(targetUserId);
                console.log('대상 소켓 ID:', targetSocketId);

                if (!targetSocketId) {
                    console.log('⚠️ 수신자가 연결되어 있지 않음:', targetUserId);
                    return;
                }

                // 수신자에게 직접 메시지 전송
                io.to(targetSocketId).emit('receive_message', {
                    message,
                    senderId,
                    timestamp: timestamp || new Date().toISOString()
                });

                console.log('✅ 메시지 전송 완료');
            } catch (error) {
                console.error('❌ 메시지 전송 실패:', error);
                socket.emit('error', {
                    message: '메시지 전송에 실패했습니다.'
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ 채팅 소켓 연결 해제:', {
                socketId: socket.id,
                userId: userId
            });
            
            // 연결 해제된 사용자 제거
            if (userId) {
                activeUsers.delete(userId);
                console.log('현재 활성 사용자:', Array.from(activeUsers.entries()));
            }
        });

        // 에러 처리
        socket.on('error', (error) => {
            console.error('소켓 에러:', error);
        });
    });

    return io;
}

module.exports = setupChatSocket; 