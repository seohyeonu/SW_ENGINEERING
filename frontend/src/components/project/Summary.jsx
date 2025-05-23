import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import styles from './css_folder/Summary.module.css';

const Summary = ({ project }) => {
  const [description, setDescription] = useState(project?.description || '');
  const [editedDescription, setEditedDescription] = useState(description);
  const [editTaskModal, setEditTaskModal] = useState(false);

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
      // 성공 시 화면에 반영
      setDescription(data.project.description);
      setEditTaskModal(false);
    } catch (error) {
      alert('프로젝트 설명 수정 중 오류가 발생했습니다.');
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