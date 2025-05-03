import React from 'react'
import styled from 'styled-components'

const TaskAlarm = () => {
  return (
    <Container>
      <Title>업무 알람</Title>
      <List>
        <div>TIME TO FLOAT<span>NEW</span></div>
        <div>TIME TO FLOAT</div>
        <div>TIME TO FLOAT</div>
      </List>
      
    </Container>
  )
}

export default TaskAlarm

const Container = styled.div`
  flex: 3;
  height: 210px;
  display: flex;
  flex-direction: column;
  color: black;
  background-color: white;
  padding: 20px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 16px;
`

const Title = styled.div`
  width: 100%;
  font-size: 30px;
  font-weight: bold;
  color: black;
  border-bottom: 3px solid black;
`

const List = styled.div`
  padding-top: 10px;
  width: 100%;
  height: 100%;
  div {
    width: 100%;
    border-bottom: 1px solid grey;
    display: flex;
    justify-content: space-between;
  }
  span {
    color: red;
  }
`