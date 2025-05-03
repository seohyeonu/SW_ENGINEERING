import React from 'react'
import styled from 'styled-components'
import Profile from '../components/home/Profile'
import TaskAlarm from '../components/home/TaskAlarm'
import TodoList from '../components/home/TodoList'

const Home = () => {
  return (
    <Container>
      <Box>
        <Profile />
        <TaskAlarm/>
      </Box>
      <TodoList/>
    </Container>
  )
}

export default Home

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
`

const Box = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  background-color: #ececec;
  gap: 30px;
`