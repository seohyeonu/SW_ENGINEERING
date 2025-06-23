import React, { useState } from 'react'
import styles from './css_folder/ProfileSettings.module.css'

const ProfileSettingsModal = ({ visible, onClose, onSave, user }) => {
  const [originalUser, setOriginalUser] = useState({
    name: user?.name || '홍길동',
    username: user?.username || 'hong123',
    email: user?.email || 'hong@example.com',
    phone: user?.phone || '010-1234-5678',
    department: user?.department || '기획팀',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [name, setName] = useState(originalUser.name);
  const [username, setUsername] = useState(originalUser.username);
  const [email, setEmail] = useState(originalUser.email);
  const [phone, setPhone] = useState(originalUser.phone);
  const [department, setDepartment] = useState(originalUser.department);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const handleVerifyPassword = async () => {
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsPasswordEditing(true);
        setShowVerifyModal(false);
        setCurrentPassword('');
        setError('');
      } else {
        setError(data.message || '현재 비밀번호가 일치하지 않습니다.');
      }
    } catch {
      setError('비밀번호 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (isPasswordEditing && newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (isPasswordEditing && newPassword) {
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.message || '비밀번호 변경 실패');
          return;
        }
      } catch {
        setError('비밀번호 변경 중 오류가 발생했습니다.');
        return;
      }
    }

    try {
      const response = await fetch(`/api/auth/profile?username=${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, department })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || '프로필 수정 실패');
        return;
      }
    } catch {
      setError('프로필 수정 중 오류가 발생했습니다.');
      return;
    }

    setError('');
    onSave({ name, username, email, phone, department });
    setOriginalUser({ name, username, email, phone, department });
    setIsEditing(false);
    setIsPasswordEditing(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>프로필 설정</h2>
        <hr />

        <label htmlFor="name">이름</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} readOnly={!isEditing} />

        <div className={styles.labelRow}>
          <label htmlFor="username">아이디</label>
          {isEditing && usernameError && (
            <span className={styles.inlineErrorText}>{usernameError}</span>
          )}
        </div>
        <input
          id="username"
          type="text"
          value={username}
          readOnly
          onClick={() => {
            if (isEditing) {
              setUsernameError('아이디는 변경할 수 없습니다.');
            }
          }}
        />

        <label htmlFor="email">이메일</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!isEditing} />

        <label htmlFor="phone">전화번호</label>
        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} readOnly={!isEditing} />

        <label htmlFor="department">부서</label>
        <input id="department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} readOnly={!isEditing} />

        {isPasswordEditing && (
          <>
            <label htmlFor="newPassword">새 비밀번호</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="off" />

            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="off" />
          </>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.modalButtonWrapper}>
          {isEditing ? (
            <>
              <button className={styles.confirmButton} onClick={handleSave}>저장</button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setIsPasswordEditing(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                  setName(originalUser.name);
                  setUsername(originalUser.username);
                  setEmail(originalUser.email);
                  setPhone(originalUser.phone);
                  setDepartment(originalUser.department);
                }}
              >취소</button>
              {!isPasswordEditing && (
                <button className={styles.confirmButton} onClick={() => {
                  setShowVerifyModal(true);
                  setCurrentPassword('');
                  setError('');
                }}>비밀번호 변경</button>
              )}
            </>
          ) : (
            <>
              <button className={styles.confirmButton} onClick={() => setIsEditing(true)}>수정하기</button>
              <button className={styles.cancelButton} onClick={onClose}>닫기</button>
            </>
          )}
        </div>
      </div>

      {showVerifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>비밀번호 확인</h3>
            <input
              type="password"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="off"
            />
            <div className={styles.modalButtonWrapper}>
              <button className={styles.confirmButton} onClick={handleVerifyPassword}>확인</button>
              <button className={styles.cancelButton} onClick={() => setShowVerifyModal(false)}>취소</button>
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsModal;