// 2025.05.31 서현우 추가 
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function GoogleLoginRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      // 토큰이 없으면 로그인 페이지로 보내기
      return navigate('/login', { replace: true });
    }

    // URL 파라미터에서 사용자 정보 추출
    const user = {
      user_id: params.get('user_id') ? Number(params.get('user_id')) : null,
      username: params.get('username') || '',
      email: params.get('email') || '',
      name: params.get('name') || '',
      phone: params.get('phone') || '',
      department: params.get('department') || '',
      status: params.get('status') || '',
      created_at: params.get('created_at') || ''
    };

    console.log('[OAuthCallback] user:', user);
    // 로그인 액션 호출 (user와 token을 함께 전달)
    login({ user, token });

    // 대시보드로 이동
    navigate('/dashboard', { replace: true });
  }, [location.search, navigate, login]);

  return <div>구글 로그인 처리 중…</div>;
}

export default GoogleLoginRedirect;