import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import styles from './css_folder/ViewModal.module.css'
import { PlusOutlined  } from '@ant-design/icons';
import modalStyles from './css_folder/Notice.module.css';
import finalCheckModalStyles from '../../common/RootLayout.module.css'
import { useAuthStore } from '../../store/authStore';

const Notice = ({projectId}) => {
  const { user } = useAuthStore();
  const [noticeList, setNoticeList] = useState([]);
  const [addNoticeModal, setAddNoticeModal] = useState(false);

  const fetchProjectTitle = async (projectId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.project?.project_name) {
        return data.project.project_name;
      } else {
        throw new Error('프로젝트 이름을 가져오지 못했습니다.');
      }
    } catch (error) {
      console.error('프로젝트 제목 조회 오류:', error);
      return '알 수 없는 프로젝트';
    }
  };


  useEffect(() => {
    console.log('Notice 컴포넌트 마운트');
    console.log('projectId:', projectId);
    
    if (Array.isArray(noticeList) && noticeList.length > 0) {
      console.log('공지사항 데이터 설정:', noticeList);
    } else {
      console.log('공지사항 데이터 없음');
    }
  }, [noticeList]);

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

  // 컴포넌트 마운트 시 공지사항 목록 가져오기
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`/api/announcements/project/${projectId}/notices`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          setNoticeList(data.notices);
        } else {
          throw new Error(data.message || '공지사항 목록 조회에 실패했습니다.');
        }
      } catch (error) {
        console.error('공지사항 목록 조회 중 오류:', error);
        setNoticeList([]);
      }
    };

    if (projectId) {
      fetchNotices();
    }
  }, [projectId]);

  // 공지사항 추가
  const addNotice = async () => {
    const title = document.getElementById('notice_title').value;
    const content = document.getElementById('notice_content').value;
    
    if (!title.trim() || !content.trim()) {
      setFinalCheckModal(true);
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          project_id: projectId
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 서버에서 새로운 공지사항 목록을 다시 가져오기
        const noticesResponse = await fetch(`/api/announcements/project/${projectId}/notices`, {
          credentials: 'include'
        });
        const noticesData = await noticesResponse.json();
        
        if (noticesResponse.ok && noticesData.success) {
          setNoticeList(noticesData.notices);
          setAddNoticeModal(false);
          // 입력 필드 초기화
          document.getElementById('notice_title').value = '';
          document.getElementById('notice_content').value = '';
        }

        // 로그 기록 요청
        try {
          const projectTitle = await fetchProjectTitle(projectId);
          const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트에 새로운 공지사항 "${title}" 을(를) 추가했습니다.`;

          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              project_id: projectId,
              user_id: user.user_id,
              content: logContent
            })
          });

          console.log('[공지사항 로그 작성 완료]');
        } catch (logError) {
          console.error('[공지사항 로그 작성 실패]:', logError);
        }

      } else {
        throw new Error(data.message || '공지사항 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 추가 중 에러 발생:', error);
      alert('공지사항 추가 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 선택 시 댓글 목록 조회
  const fetchComments = async (announcementId) => {
    try {
      const response = await fetch(`/api/announcementcomments/${announcementId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('댓글 목록 조회에 실패했습니다.');
      }

      const comments = await response.json();
      
      // 공지사항 목록 업데이트
      const updatedList = noticeList.map(notice => {
        if (notice.id === announcementId) {
          return {
            ...notice,
            comments: comments
          };
        }
        return notice;
      });

      setNoticeList(updatedList);
      setSelectedNotice(updatedList.find(n => n.id === announcementId));
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
    }
  };

  // 공지사항이 선택될 때마다 댓글 목록 조회
  useEffect(() => {
    if (selectedNotice?.id) {
      fetchComments(selectedNotice.id);
    }
  }, [selectedNotice?.id]);

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
                onClick={async () => {
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
                    <li key={comment.announcement_comment_id || idx} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentUser}>@{comment.created_by_name || '알 수 없는 사용자'}</span>
                        <span className={styles.commentTime}>
                          {comment.created_at 
                            ? formatRelativeTime(new Date(comment.created_at).getTime())
                            : '방금 전'
                          }
                        </span>
                      </div>
                      <div className={styles.commentText}>{comment.content}</div>
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
                    onClick={async () => {
                      if (!newComment.trim()) return;

                      try {
                        if (!user) {
                          throw new Error('로그인이 필요합니다.');
                        }

                        if (!user.user_id) {
                          throw new Error('사용자 ID를 찾을 수 없습니다.');
                        }

                        console.log('[공지사항 댓글 생성] 시작 ====');
                        console.log('[공지사항 댓글 생성] 현재 사용자:', user);
                        console.log('[공지사항 댓글 생성] 현재 공지사항:', selectedNotice);

                        const commentData = {
                          announcement_id: selectedNotice.id,
                          content: newComment.trim(),
                          created_by: user.user_id
                        };
                        console.log('[공지사항 댓글 생성] 요청 데이터:', commentData);

                        // API 호출하여 댓글 생성
                        const response = await fetch('/api/announcementcomments', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify(commentData),
                        });

                        if (!response.ok) {
                          const errorText = await response.text();
                          console.error('[공지사항 댓글 생성] 응답 에러:', {
                            status: response.status,
                            statusText: response.statusText,
                            errorText
                          });
                          throw new Error('댓글 생성에 실패했습니다.');
                        }

                        const newCommentData = await response.json();
                        console.log('[공지사항 댓글 생성] 응답 데이터:', newCommentData);

                        // 로그 기록 요청
                        try {
                          const projectTitle = await fetchProjectTitle(projectId);
                          const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${selectedNotice.title}" 공지사항에 댓글을 작성했습니다.`;

                          await fetch('/api/logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              project_id: projectId,
                              user_id: user.user_id,
                              content: logContent,
                            }),
                          });
                          console.log('[댓글 로그 기록 완료]');
                        } catch (logError) {
                          console.error('댓글 로그 기록 실패:', logError);
                        }

                        // 댓글 목록 새로 조회
                        const commentsResponse = await fetch(`/api/announcementcomments/${selectedNotice.id}`, {
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include'
                        });

                        if (!commentsResponse.ok) {
                          throw new Error('댓글 목록 조회에 실패했습니다.');
                        }

                        const comments = await commentsResponse.json();

                        // 공지사항 목록 업데이트
                        const updatedList = noticeList.map(notice => {
                          if (notice.id === selectedNotice.id) {
                            return {
                              ...notice,
                              comments: comments
                            };
                          }
                          return notice;
                        });

                        setNoticeList(updatedList);
                        setSelectedNotice(updatedList.find(n => n.id === selectedNotice.id));
                        setNewComment('');

                        console.log('[공지사항 댓글 생성] 완료 ====');
                      } catch (error) {
                        console.error('[공지사항 댓글 생성] 오류 발생:', error);
                        alert(error.message || '댓글을 생성하는 중 오류가 발생했습니다.');
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

              

              <div className={modalStyles.modalButtonWrapper}>
                <button
                  id={modalStyles.confirmButton}
                  onClick={async () => {
                    try {
                      // 1. DB에 반영
                      const response = await fetch(`/api/announcements/${selectedNotice.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          title: editTitle,
                          content: editContent
                        })
                      });

                      const result = await response.json();
                      if (!response.ok || !result.success) {
                        throw new Error(result.message || '공지사항 수정 실패');
                      }

                      // 2. 프론트 상태 반영
                      const updatedList = noticeList.map((notice) =>
                        notice.id === selectedNotice.id
                          ? {
                              ...notice,
                              title: editTitle,
                              content: editContent,
                              updatedAt: new Date().toISOString().split('T')[0],
                            }
                          : notice
                      );

                      setNoticeList(updatedList);
                      setSelectedNotice({ ...selectedNotice, title: editTitle, content: editContent });
                      setEditNoticeModal(false);
                      setViewNoticeModal(true);

                      // 3. 로그 기록
                      const projectTitle = await fetchProjectTitle(projectId);
                      const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${editTitle}" 공지사항을 수정했습니다.`;
                      await fetch('/api/logs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          project_id: projectId,
                          user_id: user.user_id,
                          content: logContent,
                        }),
                      });
                    } catch (error) {
                      console.error('공지사항 수정 중 오류:', error);
                      alert(error.message);
                    }
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
                <h4>제목, 내용을 모두 입력해주세요.</h4>
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