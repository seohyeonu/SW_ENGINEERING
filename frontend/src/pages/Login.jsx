import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'
import { login as loginApi } from '../api/auth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (email && password) {
        const response = await loginApi(email, password)
        // 로그인 성공 시 사용자 정보 저장
        setAuth(response.user)
        navigate('/')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <Container className="login-container">
      <Form onSubmit={handleSubmit}>
        <Title>HELLO, WELCOME</Title>
        <div>
          <label htmlFor="email"></label>
          <Input
            placeholder='Email'
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password"></label>
          <Input
            placeholder='Password'
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit">LOGIN</Button>
        <RegisterLink onClick={() => navigate('/register')}>
          계정이 없으신가요? 회원가입하기
        </RegisterLink>
      </Form>
    </Container>
  )
}

export default Login;

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

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: white;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`