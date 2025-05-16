import React, { useState } from 'react'
import styled from 'styled-components'

const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: "오늘까지 디자인 최종안 제출하기", checked: false, priority: "HIGH" },
    { id: 2, text: "TIME TO FLOAT", checked: false, priority: "MEDIUM" },
    { id: 3, text: "설계서 제출하기", checked: false, priority: "LOW" }
  ]);

  const handleCheckboxChange = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, checked: !todo.checked } : todo
    ));
  };

  return (
    <Container>
      <Title>TO-DO LIST</Title>
      {todos.map(todo => (
        <TodoItem key={todo.id}>
          <CheckboxContainer>
            <Checkbox 
              type="checkbox" 
              checked={todo.checked} 
              onChange={() => handleCheckboxChange(todo.id)}
            />
            <TodoText checked={todo.checked}>{todo.text}</TodoText>
          </CheckboxContainer>
          <PriorityTag priority={todo.priority}>{todo.priority}</PriorityTag>
        </TodoItem>
      ))}
    </Container>
  )
}

export default TodoList

const Container = styled.div`
  height: 250px;
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

const TodoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
`

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
`

const Checkbox = styled.input`
  margin-right: 10px;
  cursor: pointer;
  width: 18px;
  height: 18px;
`

const TodoText = styled.div`
  color: ${props => props.checked ? '#999' : 'black'};
  text-decoration: ${props => props.checked ? 'line-through' : 'none'};
  transition: all 0.3s ease;
`

const PriorityTag = styled.div`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  background-color: ${props => {
    switch(props.priority) {
      case 'HIGH':
        return '#8BB3FF';
      case 'MEDIUM':
        return '#B1CCFF';
      case 'LOW':
        return '#D6E4FF';
      default:
        return '#eee';
    }
  }};
`