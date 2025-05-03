import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { register } from '../api/auth'

const ExRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_check: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.password_check) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      const response = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.password_check
      )
      if (response.success) {
        navigate('/login')
      } else {
        setError(response.message)
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Title>회원가입</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Input
          type="text"
          name="username"
          placeholder="이름"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="이메일"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Input
          type="password"
          name="password_check"
          placeholder="비밀번호 확인"
          value={formData.password_check}
          onChange={handleChange}
          required
        />
        <Button type="submit">가입하기</Button>
        <LoginLink onClick={() => navigate('/login')}>
          이미 계정이 있으신가요? 로그인하기
        </LoginLink>
      </Form>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #242424;
  padding: 20px;
  box-sizing: border-box;
`

const Form = styled.form`
  background: #242424;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  margin: auto;
`

const Title = styled.h1`
  margin: 0 0 2rem 0;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  white-space: nowrap;
`

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: transparent;
  color: white;

  &::placeholder {
    color: #999;
  }
`

const Button = styled.button`
  width: 100%;
  padding: 0.8rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #0056b3;
  }
`

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
  text-align: center;
`

const LoginLink = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: white;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

export default ExRegister