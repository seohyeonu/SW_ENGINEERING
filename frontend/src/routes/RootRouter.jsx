import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PrivateRoute } from '../common/PrivateRoute'
import RootLayout from '../common/RootLayout'
import Dashboard from '../pages/Dashboard'
import Project from '../pages/Project'
import NotFound from '../pages/NotFound'
import Main from '../pages/Main';
import SignInAndSignUp from '../pages/SignInAndSignUp'
import { ConfigProvider } from 'antd'

function RootRouter() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ConfigProvider
      theme={{
        token: {
          // colorPrimary: '#00b96b',
          fontFamily: 'NotoSans',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* 인증 안 된 라우팅(로그인 전) */}
          <Route path="/" element={<Main />}/>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignInAndSignUp />} 
          />

          {/* 인증된 라우팅(로그인 후) */}
          <Route element={<PrivateRoute />}>
            <Route element={<RootLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/project/:id" element={<Project />} />
            </Route>
          </Route>

          {/* 경로없는 라우팅 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default RootRouter