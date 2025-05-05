import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'
import profilePic from '../assets/img/profilePic.png'
import { logout as logoutApi } from '../api/auth'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutApi(user.email)  
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <OutterContainer>
      {/* 헤더 영역 */}
      <Header>
        <div className="logo">WAFLLE</div>
        <ProfileImgBox>
          <img src={profilePic} alt="logo" />
        </ProfileImgBox>
        <div className="user-info">
          {user?.username} 님
        </div>
        <button onClick={handleLogout}>LOGOUT</button>
      </Header>

      <InnerContainer>
        <NavBox className="navigation">
          <span>HOME</span>
          <span>PROJECT1</span>
          <span>PROJECT2</span>
          <span>PROJECT3</span>
          <span>PROJECT4</span>
        </NavBox>

        <Main>
          <Outlet />
        </Main>
      </InnerContainer>
    </OutterContainer>
  )
}

export default Layout;

const OutterContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  height: 100%;
`

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: calc(100vh - 60px);
  height: 100%;
`

const Header = styled.header`
  width: 100%;
  height: 60px;
  background-color: #3c3c3c;
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
  .logo {
    margin-left: 20px;
    margin-right: auto;
    color: #00ff93;
    font-weight: 600;
  }
  button {
    margin-right: 20px;
  }
`

const NavBox = styled.div`
  width: 200px;
  min-height: calc(100vh - 60px);
  height: 100%;
  background-color: #d0d0d0;
  color: black;
  display: flex;
  flex-direction: column;
  span {
    margin-top: 30px;
    margin-left: 50px;
    cursor: pointer;
  }
`

const Main = styled.main`
  width: calc(100vw - 260px);
  min-height: calc(100vh - 120px);
  background-color: #ececec;
  padding: 30px;
`

const ProfileImgBox = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`