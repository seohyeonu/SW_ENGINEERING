import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GoogleLoginButton.module.css'; // 필요시 스타일

export default function GoogleLoginButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    // 프론트에서 /google-login 으로 이동
    navigate('/google-login');
  };

  return (
    <button onClick={handleClick}>
      <img
        src="/assets/google-logo.png"
        alt="Google logo"
        className={styles.logo}
      />
      <span>Google로 로그인</span>
    </button>
  );
}