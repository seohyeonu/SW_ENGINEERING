import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import styles from './css_folder/MembersFloatingButton.module.css';

export default function ChatModal({ isOpen, onClose, targetMember }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuthStore();
  const chatBodyRef = useRef(null);
  const messagesRef = useRef(new Set());

  useEffect(() => {
    let newSocket = null;

    if (isOpen && targetMember && user) {
      console.log('채팅 연결 정보:', {
        userId: user.user_id,
        targetId: targetMember.id,
        targetName: targetMember.name
      });

      // Socket.IO 연결 설정
      newSocket = io('http://localhost:3000', {
        path: '/socket.io',
        withCredentials: true,
        query: {
          userId: user.user_id,
          targetUserId: targetMember.id
        },
        transports: ['websocket', 'polling']
      });

      // 연결 이벤트
      newSocket.on('connect', () => {
        console.log('채팅 소켓 연결 성공:', newSocket.id);
        setConnected(true);
        newSocket.emit('register', user.user_id);
      });

      // 연결 에러
      newSocket.on('connect_error', (error) => {
        console.error('채팅 소켓 연결 실패:', error);
        setConnected(false);
      });

      // 메시지 수신
      newSocket.on('receive_message', (data) => {
        console.log('메시지 수신:', data);
        
        const messageId = `${data.timestamp}-${data.senderId}-${data.message}`;
        
        if (!messagesRef.current.has(messageId)) {
          messagesRef.current.add(messageId);
          
          setMessages(prev => [...prev, {
            id: messageId,
            text: data.message,
            sender: data.senderId === user.user_id ? 'me' : 'other',
            timestamp: data.timestamp,
            senderName: data.senderId === user.user_id ? '나' : targetMember.name
          }]);
        }
      });

      // 에러 처리
      newSocket.on('error', (error) => {
        console.error('채팅 에러:', error);
        alert(error.message || '메시지 전송 중 오류가 발생했습니다.');
      });

      setSocket(newSocket);
    }

    // 정리 함수
    return () => {
      if (newSocket) {
        console.log('채팅 연결 종료');
        newSocket.disconnect();
        setConnected(false);
        setMessages([]);
        messagesRef.current.clear();
      }
    };
  }, [isOpen, targetMember, user]);

  // 스크롤 처리
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // 메시지 전송 처리
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !connected || !user) return;

    const trimmedMessage = message.trim();
    const timestamp = new Date().toISOString();
    const messageId = `${timestamp}-${user.user_id}-${trimmedMessage}`;

    try {
      // 메시지 중복 체크
      if (!messagesRef.current.has(messageId)) {
        messagesRef.current.add(messageId);
        
        // 내 메시지를 화면에 추가
        setMessages(prev => [...prev, {
          id: messageId,
          text: trimmedMessage,
          sender: 'me',
          timestamp: timestamp,
          senderName: '나'
        }]);

        // 서버로 메시지 전송
        console.log('메시지 전송:', {
          to: targetMember.id,
          message: trimmedMessage
        });

        socket.emit('send_message', {
          targetUserId: targetMember.id,
          message: trimmedMessage,
          timestamp: timestamp
        });
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }

    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatModal}>
      <div className={styles.chatHeader}>
        <h3>{targetMember?.name || '채팅'}</h3>
        <div style={{ fontSize: '12px', color: connected ? '#4caf50' : '#ff5252' }}>
          {connected ? '연결됨' : '연결 중...'}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <i className='bx bx-x'></i>
        </button>
      </div>
      <div className={styles.chatBody} ref={chatBodyRef}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.messageContainer} ${msg.sender === 'me' ? styles.myMessage : styles.otherMessage}`}
          >
            <div className={styles.messageHeader}>
              <span className={styles.senderName}>{msg.senderName}</span>
              <span className={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className={styles.messageContent}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form className={styles.chatFooter} onSubmit={handleSendMessage}>
        <input
          type="text"
          className={styles.messageInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={!connected || !user}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={!connected || !user}
        >
          전송
        </button>
      </form>
    </div>
  );
} 