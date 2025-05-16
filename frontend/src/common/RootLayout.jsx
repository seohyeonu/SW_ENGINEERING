import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'
import { Breadcrumb, Layout, Menu } from 'antd';
import { UserOutlined, HomeOutlined, FolderOpenOutlined, BellOutlined, MoreOutlined, LogoutOutlined  } from '@ant-design/icons';
import { Header } from 'antd/es/layout/layout'
import Sider from 'antd/es/layout/Sider'

const RootLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  //서버에서 호출하는걸로 수정필요
  const projectList = [
    {id: 1, name: 'project1'},
    {id: 2, name: 'project2'},
  ]

  const navItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate(`/dashboard`),
    },
    {
      key: 'project',
      icon: <FolderOpenOutlined />,
      label: 'Project',
      children: projectList.map((project) => ({
        key: project.id.toString(),
        label: project.name,
        onClick: () => navigate(`/project/${project.id}`),
      })),
    },
  ];

  const [collapsed, setCollapsed] = useState(true);
  const handleMouseEnter = () => {
    setCollapsed(false);
  };
  const handleMouseLeave = () => {
    setCollapsed(true);
  };


  return (
    <OutterContainer>
      <SHeader>
        <div className="logo">Wiffle</div>
        <div className='alert'>
          <BellOutlined style={{ fontSize: '20px' }} />
        </div>
        <UserBox>
          <ProfileImgBox>
            <UserOutlined />
          </ProfileImgBox>
          <div className="user-info">
            {user?.username} 님
          </div>
        </UserBox>
        <div className='kebab'>
          <MoreOutlined style={{ fontSize: '20px' }} />
        </div>
      </SHeader>
      <InnerContainer>
        <SideNav
          collapsed={collapsed}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SMenu
            mode="inline"
            defaultSelectedKeys={['home']}
            style={{ height: '100%', borderRight: 0 }}
            items={navItems}
          />
          <LogoutButton onClick={handleLogout}>
            <LogoutOutlined/>
            {/* <span>Logout</span> */}
          </LogoutButton>
        </SideNav>
        <MainContainer>
          <Outlet />
        </MainContainer>
      
      </InnerContainer>
    </OutterContainer>
  )
}

export default RootLayout;

const OutterContainer = styled(Layout)`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  height: 100%;
`

const InnerContainer = styled(Layout)`
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: calc(100vh - 90px);
  height: 100%;
  position: relative;
`

const SHeader = styled(Header)`
  padding: 0 36px;
  width: 100%;
  min-width: 100vw;
  height: 90px;
  background-color: white;
  color: #454545;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #454545;
  border-radius: 0 0 20px 0;
  .logo {
    margin-right: auto;
    color: #659BFF;
    font-size: 25px;
    font-family: 'PlayfairBlack';
  }
  .alert {
    cursor: pointer;
  }
  .kebab {
    cursor: pointer;
  }
`

const SideNav = styled(Sider)`
  /* width: ${(props) => props.collapsed ? '72px' : '188px'} !important;
  min-width: ${(props) => props.collapsed ? '72px' : '188px'} !important;
  max-width: ${(props) => props.collapsed ? '72px' : '188px'} !important; */
  padding-top: 24px;
  background-color: white;
  position: relative;
  border-right: 1px solid #454545;
`;

const SMenu = styled(Menu)`
  font-family: 'PopinsMedium';
  & i {
    display: none;
  }
`

const LogoutButton = styled.button`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  cursor: pointer;
  background-color: white;
  
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  outline: none;
  
`;

const MainContainer = styled.main`
  /* width: ${(props) => props.collapsed ? 'calc(100vw - 72px)' : 'calc(100vw - 188px)'} !important; */
  min-height: calc(100vh - 90px);
  background-color: white;
  padding: 40px;
  flex: 1;
  overflow: hidden;
`

const ProfileImgBox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #454545;
  overflow: hidden;
  margin-right: 8px;
`

const UserBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: 40px;
  border: 1px solid #454545;
  border-radius: 24px;
  padding: 0 16px;
`