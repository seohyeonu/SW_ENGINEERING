import React from 'react'
<<<<<<< HEAD

const NotFound = () => {
  return (
    <div>NotFound</div>
  )
}

export default NotFound
=======
import styled from 'styled-components'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  console.log('auth 상태:', useAuthStore.getState());

  const handleLogout = () => {
    logout()               // 상태 초기화
    navigate('/login')     // 로그인 화면으로 이동
  }

  return (
    <Container>
      <button className="logout-btn" onClick={handleLogout}>개발용 비상탈출 버튼</button>
      <span className="title">😵 Not Found</span>
      <span className="desc">잘못된 주소이거나 네트워크 오류입니다</span>
    </Container>
  )
}

export default NotFound

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  height: 100vh;

  .logout-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 14px;
    border: none;
    background-color: #ef4444;
    color: white;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
  }

  .title {
    font-size: 18px;
    margin-top: 100px;
  }

  .desc {
    font-size: 11px;
    color: #454545;
    margin-top: 10px;
  }
`
>>>>>>> origin/future_direction
