import React from 'react'
import styled from 'styled-components'
import { useAuthStore } from '../../store/authStore'
import profilePic from '../../assets/img/profilePic.png'

const Profile = () => {
  const { user } = useAuthStore()

  return (
    <Container>
      <ImgBox><img src={profilePic} alt="logo" /></ImgBox>
      <InfoBox>
        <Title>{user?.username}</Title>
        <div>소속 : 00대학교</div>
        <div>개인 연락처 : 010 - 1234 - 5678</div>
        <div>개인 이메일 : user@gmail.com</div>
      </InfoBox>

    </Container>
  )
}

export default Profile

const Container = styled.div`
  background-color: white;
  height: 250px;
  display: flex;
  flex-direction: row;
  color: black;
  flex: 4;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 16px;
`

const ImgBox = styled.div`
  flex: 1;
  padding: 30px;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const InfoBox = styled.div`
  flex: 3;
  padding-top: 20px;
  padding-right: 30px;
`

const Title = styled.div`
  width: 100%;
  font-size: 30px;
  font-weight: bold;
  color: black;
  border-bottom: 3px solid black;
  margin-bottom: 10px;
`
