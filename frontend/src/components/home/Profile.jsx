import React from 'react'
import styled from 'styled-components'
import { useAuthStore } from '../../store/authStore'
import profilePic from '../../assets/img/profilePic.png'

const Profile = () => {
  const { user } = useAuthStore()

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phoneNumber) => {
    //1. 전화번호가 없으먼  빈문자열 반환
    if (!phoneNumber) return '';
    
    // 숫자만 추출(010-5925-7536 이런 식으로 번호가 db에 저장되어 있을 수도 있으니까 여기서 필요한 부분만 뽑아냄)
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // 포맷팅 010-1234-5678 형식으로 매핑
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)} - ${cleaned.slice(3, 7)} - ${cleaned.slice(7)}`;
    }
    return phoneNumber;
  };

  return (
    <Container>
      <ImgBox><img src={profilePic} alt="logo" /></ImgBox>
      <InfoBox>
        <Title>{user?.name || '사용자'}</Title>
        <div>소속 : {user?.department || '정보 없음'}</div>
        <div>개인 연락처 : {formatPhoneNumber(user?.phone) || '정보 없음'}</div>
        <div>개인 이메일 : {user?.email || '정보 없음'}</div>
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
