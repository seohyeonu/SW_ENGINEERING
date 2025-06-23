import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import styles from './css_folder/Summary.module.css';
import warningModalStyles from '../../common/RootLayout.module.css'
import { useAuthStore } from '../../store/authStore';

const Summary = ({ project }) => {
  const { user } = useAuthStore();
  
  const [description, setDescription] = useState(project?.description || '');
  const [editedDescription, setEditedDescription] = useState(description);
  const [editTaskModal, setEditTaskModal] = useState(false);
  const [warningModal, setWarningModal] = useState(false);

  useEffect(() => {
    setDescription(project?.description || '');
  }, [project]);

  const handleMenuClick = ({ key }) => {
    if (key === 'edit') {
      setEditedDescription(description);
      setEditTaskModal(true);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/projects/${project.project_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 로그인 인증 필요 시
        body: JSON.stringify({
          description: editedDescription,
        }),
      });
  
      if (!response.ok) {
        throw new Error('프로젝트 설명 수정 실패');
      }
  
      const data = await response.json();

      // 로그 기록 요청
      const logContent = `[${project?.project_name || '알 수 없는'}] 프로젝트의 개요가 수정되었습니다.`;
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id: project.project_id,
          user_id: user.user_id, // ← 로그인된 사용자 ID로 수정
          content: logContent,
        }),
      });
      
      // 성공 시 화면에 반영
      setDescription(data.project.description);
      setEditTaskModal(false);
    } catch (error) {
      setWarningModal(true);
      console.error(error);
    }
  };

  const menu = {
    items: [
      {
        key: 'edit',
        label: '수정하기',
        onClick: handleMenuClick,
      },
    ],
  };
  
  <Dropdown menu={menu} trigger={['click']}>
    <button>
      <EllipsisOutlined />
    </button>
  </Dropdown>

  return (
    <main>
      <Header>
        <div className="title">프로젝트 개요</div>
        <div className="btnWrapper">
          <Dropdown menu={menu} trigger={['click']}>
            <button>
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>
      </Header>

      <Article>
        <div className={styles.articleScrollBox}>
          <p>{description}</p>
        </div>
      </Article>

      {editTaskModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={(e) => {
            // 모달 외부 클릭 시 모달 닫기
            if (e.target.className === styles.modalOverlay) {
              setEditTaskModal(false);
            }
          }}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>프로젝트 개요 수정</h2>
            <hr />

            <div className={styles.formGroup}>
              <label htmlFor="content">내용:</label>
              <textarea
                id="content"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalButtonWrapper}>
              <button id={styles.confirmButton} onClick={handleSave}>
                수정 완료
              </button>
              <button id={styles.cancelButton} onClick={() => setEditTaskModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {warningModal && (
        <div className={warningModalStyles.finalCheckModalOverlay}>
          <div className={warningModalStyles.finalCheckModalContent}>
            <h2>경고!</h2> <hr />

            <div className={warningModalStyles.main_text}>
              <h4>내용을 입력해주세요.</h4>
            </div>

            <div className={warningModalStyles.modalButtonWrapper}>
              <button id={warningModalStyles.confirmButton} onClick={() => {setWarningModal(false);}}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Summary;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 24px;
  color: #454545;
  button {
    width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    background-color: white;
    outline: none;
    border: none;
  }
`;

const Article = styled.article`
  margin-top: 24px;
  p {
    margin: 0;
  }
`;