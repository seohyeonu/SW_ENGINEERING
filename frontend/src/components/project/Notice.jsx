import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import styles from './css_folder/ViewModal.module.css'
import { PlusOutlined  } from '@ant-design/icons';
import modalStyles from './css_folder/Notice.module.css';
import finalCheckModalStyles from '../../common/RootLayout.module.css'

const Notice = ({projectId, notices}) => {
  const [addNoticeModal, setAddNoticeModal] = useState(false);

  const [noticeList, setNoticeList] = useState([]);

  useEffect(() => {
    console.log('Notice 컴포넌트 마운트');
    console.log('projectId:', projectId);
    console.log('notices prop:', notices);
    
    if (Array.isArray(notices) && notices.length > 0) {
      console.log('공지사항 데이터 설정:', notices);
      setNoticeList(notices);
    } else {
      console.log('공지사항 데이터 없음');
      setNoticeList([]);
    }
  }, [notices]);

  useEffect(() => {
    console.log('현재 noticeList 상태:', noticeList);
  }, [noticeList]);

  // 제목 클릭시 자세히 보기에 대한 부분
  const [viewNoticeModal, setViewNoticeModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [newComment, setNewComment] = useState('');

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000); // 초 단위

    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;

    const date = new Date(timestamp);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  // 공지사항 조회수 증가 함수
  const incrementNoticeViews = async (noticeId) => {
    try {
      const response = await fetch(`/api/announcements/${noticeId}/views`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('공지사항 조회수 증가 실패:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('공지사항 조회수 증가 성공:', data);
      
      // 조회수 업데이트
      const updatedNoticeList = noticeList.map(notice => 
        notice.id === noticeId ? { ...notice, views: data.views } : notice
      );
      
      setNoticeList(updatedNoticeList);
    } catch (error) {
      console.error('공지사항 조회수 증가 오류:', error);
    }
  };

  const [editNoticeModal, setEditNoticeModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  const [finalCheckModal, setFinalCheckModal] = useState(false);

  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTrigger(prev => prev + 1); // 강제 리렌더링 유도
    }, 60000); // 1000 = 1초

    return () => clearInterval(interval); // 클린업
  }, []);


  // 공지사항 추가하기 위한 백엔드 요청 
  const addNotice = async () => {
    const title = document.getElementById('notice_title').value.trim();
    const content = document.getElementById('notice_content').value.trim();

    if (!title || !content) {
      setFinalCheckModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          project_id: projectId
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('공지사항 추가 실패:', response.status);
        return;
      }

      const data = await response.json();
      console.log('공지사항 추가 성공:', data);

      // 새로운 공지사항을 목록에 추가
      const newNotice = {
        id: data.announcement_id,
        title: data.title,
        content: data.content,
        author: data.author_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        views: 0
      };

      setNoticeList(prev => [...prev, newNotice]);
      setAddNoticeModal(false);
    } catch (error) {
      console.error('공지사항 추가 오류:', error);
    }
  };

  return (
    <main>
      <Header>
        <div className='title'>Notice ({noticeList.length})</div>
        <div className='btnWrapper'>
          <button onClick={() => {setAddNoticeModal(true)}}><PlusOutlined/></button>
        </div>
      </Header>
      <div style={{ height: '300px', overflowY: 'auto', marginTop: '1rem'}}>
        <List style={{paddingTop: '0'}}>
          {noticeList.map((notice) => (
            <div key={notice.id} style={{height: '20px', marginBottom: '15px'}}>
              <span 
                className={modalStyles.title} 
                onClick={() => {
                  console.log('공지사항 클릭:', notice);
                  setSelectedNotice(notice);
                  setViewNoticeModal(true);
                  incrementNoticeViews(notice.id);
                }}
              >
                {notice.title}
              </span>
              <span className='author'>{notice.author}</span>
              <span className='createdAt'>{notice.createdAt}</span>
            </div>
          ))}
        </List>
      </div>

      {/* Notice Modal */}
      {addNoticeModal && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <h2>공지사항 추가</h2> <hr/>
              <label htmlFor="notice_title">제목: </label> <br/>
              <input type="text" name="notice_title" id="notice_title" /> <br/>

              <label htmlFor="notice_content">내용: </label> <br/>
              <textarea id="notice_content" className={modalStyles.textareaInput}></textarea> <br/>

              {/* <label htmlFor="notice_writer">작성자: </label> <br/>
              <input type="text" name="notice_writer" id="notice_writer" /> <br/> */}

              <div className={modalStyles.modalButtonWrapper}>
                <button
                  id={modalStyles.confirmButton}
                  onClick={addNotice}
                >
                  작성 완료
                </button>
                <button id={modalStyles.cancelButton} onClick={() => setAddNoticeModal(false)}>닫기</button>
              </div>
            </div>
          </div>
        )}

        {viewNoticeModal && selectedNotice && (
          <div className={styles.viewModalOverlay}>
            <div className={styles.viewModalContent}>
              {/* 왼쪽: 공지 정보 */}
              <div className={styles.leftSection}>
                <h2>{selectedNotice.title}</h2>

                <div className={styles.metaInfo}>
                  <p><strong>작성자:</strong> {selectedNotice.author}</p>
                  <p><strong>작성일:</strong> {selectedNotice.createdAt}</p>
                  <p><strong>수정일:</strong> {selectedNotice.updatedAt || '-'}</p>
                  <p><strong>조회수:</strong> {selectedNotice.views || 0}</p>
                </div>

                <hr />

                <p className={styles.label}>내용:</p>
                <div className={styles.contentScrollBox}>
                  {selectedNotice.content || '공지 내용이 없습니다.'}
                </div>

                <div className={styles.modalButtonWrapper}>
                  <button
                    id={styles.editButton}
                    onClick={() => {
                      setEditingIndex(selectedNotice.id);
                      setEditTitle(selectedNotice.title);
                      setEditContent(selectedNotice.content);
                      setEditNoticeModal(true);
                      setViewNoticeModal(false);
                    }}
                  >
                    수정하기
                  </button>
                  <button id={styles.closeButton} onClick={() => setViewNoticeModal(false)}>
                    닫기
                  </button>
                </div>
              </div>

              {/* 오른쪽: 댓글 영역 */}
              <div className={styles.rightSection}>
                <h3>Comment ({selectedNotice.comments?.length || 0})</h3>

                <ul className={styles.commentList}>
                  {(selectedNotice.comments || []).map((comment, idx) => (
                    <li key={idx} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentUser}>@{comment.user}</span>
                        <span className={styles.commentTime}>
                          {
                            typeof comment.timestamp === 'number'
                              ? formatRelativeTime(comment.timestamp)
                              : comment.time || '방금 전'
                          }
                        </span>
                      </div>
                      <div className={styles.commentText}>{comment.text}</div>
                    </li>
                  ))}
                </ul>

                <div className={styles.commentInputBox}>
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!newComment.trim()) return;

                      const updated = [...noticeList];
                      const index = updated.findIndex(n => n.title === selectedNotice.title);

                      if (index !== -1) {
                        const commentObj = {
                          user: 'User1',
                          timestamp: Date.now(),
                          text: newComment.trim(),
                        };

                        const newComments = [
                          ...(updated[index].comments || []),
                          commentObj,
                        ];

                        updated[index] = {
                          ...updated[index],
                          comments: newComments,
                        };

                        setNoticeList(updated);
                        setSelectedNotice({ ...updated[index] }); // 댓글 반영된 공지 재설정
                        setNewComment('');
                      }
                    }}
                  >
                    작성
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editNoticeModal && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <h2>공지사항 수정</h2> <hr />
              <label htmlFor="notice_title">제목: </label> <br />
              <input
                type="text"
                id="notice_title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              /> <br />

              <label htmlFor="notice_content">내용: </label> <br />
              <textarea
                id="notice_content"
                className={modalStyles.textareaInput}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              ></textarea> <br />

              <label htmlFor="notice_writer">작성자: </label> <br />
              <input type="text" id="notice_writer" value={editAuthor} readOnly/> <br />

              <div className={modalStyles.modalButtonWrapper}>
                <button
                  id={modalStyles.confirmButton}
                  onClick={() => {
                    const updated = [...noticeList];
                    updated[editingIndex] = {
                      ...updated[editingIndex],
                      title: editTitle,
                      content: editContent,
                      author: editAuthor,
                      updatedAt: new Date().toISOString().split('T')[0],
                    };
                    setNoticeList(updated);
                    setSelectedNotice({ ...updated[editingIndex] });
                    setEditNoticeModal(false);
                    setViewNoticeModal(true);
                  }}
                >
                  수정 완료
                </button>
                <button
                  id={modalStyles.cancelButton}
                  onClick={() => setEditNoticeModal(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {finalCheckModal && (
          <div className={finalCheckModalStyles.finalCheckModalOverlay}>
            <div className={finalCheckModalStyles.finalCheckModalContent}>
              <h2>경고!</h2> <hr />
  
              <div className={finalCheckModalStyles.main_text}>
                <h4>제목, 내용, 작성자를 모두 입력해주세요.</h4>
              </div>
  
              <div className={finalCheckModalStyles.modalButtonWrapper}>
                <button id={finalCheckModalStyles.confirmButton} onClick={() => {setFinalCheckModal(false);}}>확인</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'none' }}>{renderTrigger}</div>
    </main>
  )
}

export default Notice

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
`

const List = styled.div`
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  
  div {
    width: 100%;
    height: 39px;
    display: flex;
    border-bottom: 1px solid #454545;
    align-items: center;

    .author {
      margin-right: 12px;
      color: #454545;
    }
    .createdAt {
      color: #454545;
    }
  }
`