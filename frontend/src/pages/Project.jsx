import React from 'react'
import styled from 'styled-components'
import Summary from '../components/project/Summary'
import Notice from '../components/project/Notice'
import TodoList from '../components/project/TodoList'

const Project = () => {
  //서버에서 호출하는 것으로 수정 필요
  const projectDetail = {
    name: 'Project',
    author: '유저'
  }

  return (
    <main>
      <Title>
        <span className='main'>{projectDetail.name}</span>
        <span className='sub'>{projectDetail.author}</span>
      </Title>
      <Container>
        <div className='left'>
          <Summary/>
          <Notice/>
        </div>
        <div className='right'>
          <TodoList/>
        </div>
      </Container>
    </main>
  )
}

export default Project

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  gap: 145px;
  .left {
    display: flex;
    flex-direction: column;
    gap: 96px;
    /* justify-content: space-between; */
    flex: 5;
  }
  .right {
    flex: 2;
  }
`

const Title = styled.div`
  margin-bottom: 48px;
  color: #454545;
  .main {
    font-family: 'PopinsBold';
    font-size: 36px;
    margin-right: 24px;
  }
  .sub {
    font-size: 16px;
  }
`