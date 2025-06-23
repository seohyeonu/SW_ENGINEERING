// 2025.05.31 서현우 sns 로그인 구현을 위한 코드
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Cookies from 'js-cookie';

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    // URLSearchParams에서 값을 추출
    const token = searchParams.get('token');
    const user_id = searchParams.get('user_id');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const created_at = searchParams.get('created_at');
    const profile_image = searchParams.get('profile_image');
    const oauth_provider = searchParams.get('oauth_provider');

    if (token && user_id && username) {
      // 사용자 정보 객체 생성
      const user = {
        user_id: Number(user_id),
        username,
        email,
        name,
        phone,
        department,
        status,
        created_at,
        profile_image,
        oauth_provider
      };

      // 토큰을 쿠키에 저장 (httpOnly가 아닌 쿠키로 저장)
      Cookies.set('token', token, {
        expires: 1,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
      });

      // 소셜 로그인으로 상태 설정
      login({ user, type: 'social' });

      // 리다이렉트 전에 상태 업데이트가 완료되도록 setTimeout 사용
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } else {
      // 필요한 파라미터가 없다면 로그인 페이지로 돌아가기
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div>
      <p>로그인 처리 중입니다...</p>
    </div>
  );
}

export default OAuthCallback;