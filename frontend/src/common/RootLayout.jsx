import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'
import finalCheckModalStyles from './RootLayout.module.css'
import alertStyles from './AlertDropdown.module.css'
import warningModalStyles from '../common/RootLayout.module.css'
import { Breadcrumb, Layout, Menu, Modal, Dropdown, App } from 'antd';
import { UserOutlined, HomeOutlined, FolderOpenOutlined, BellOutlined, MoreOutlined, LogoutOutlined, HistoryOutlined } from '@ant-design/icons';
import { Header } from 'antd/es/layout/layout'
import Sider from 'antd/es/layout/Sider'
import styles from './RootLayoutOfModal.module.css'
import ProfileSettingsModal from '../pages/ProfileSettings'
import { io } from 'socket.io-client';

const RootLayout = () => {
  const { message } = App.useApp();
  const socket = useRef(null);
  // 개발 환경에서만 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('=== RootLayout 컴포넌트 렌더링 시작 ===');
  }
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false)
  const [profileSettingsVisible, setProfileSettingsVisible] = useState(false);

  useEffect(() => {
    if (user && user.user_id) {
      socket.current = io('http://localhost:3000');  // 백엔드 주소로 맞춰주면 됨.
      socket.current.emit('register', user.user_id);

      socket.current.on('new-notification', (data) => {
        console.log('📩 실시간 알림 수신:', data);
        setNotifications((prev) => [data, ...prev]);
      });
    }

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [user]);


  const handleLogout = () => {
    setFinalCheckModal(true)
  }
  
  // 인증 상태에 따라 로그인 페이지로 리다이렉트
  useEffect(() => {
    // 로그인 페이지나 회원가입 페이지가 아닌 경우에만 체크
    const currentPath = window.location.pathname;
    if (!user && !currentPath.includes('/login') && !currentPath.includes('/signup')) {
      console.log('인증되지 않은 사용자, 로그인 페이지로 이동');
      window.location.href = '/login';
    }
  }, [user]);

  // 프로젝트 목록 상태 - 빈 배열로 초기화하고 서버에서 가져온 데이터로 채움
  const [projectList, setProjectList] = useState([]);




  // 1. 프로젝트 목록 가져오기 함수를 별도로 분리
  const fetchProjectsFromServer = async () => {
    try {
      console.log('[서버] 프로젝트 목록 요청 시작');
      const response = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[서버] 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`프로젝트 목록 가져오기 실패: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[서버] 응답 데이터:', data);

      if (data.success) {
        setProjectList(data.projects);
        console.log('[서버] 프로젝트 목록 가져오기 성공:', data.projects);
      } else {
        console.error('[서버] 프로젝트 목록 가져오기 실패:', data.message);
      }
    } catch (error) {
      console.error('[서버] 프로젝트 목록 가져오기 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 프로젝트 목록 가져오기
  useEffect(() => {
    fetchProjectsFromServer();
  }, []); // 컴포넌트 마운트 시 한 번만 실행
  
  // 2. 각 프로젝트의 공지사항(notices)을 서버에서 가져오기
  useEffect(() => {
    console.log('[공지사항] useEffect 실행, projectList:', projectList);
    
    // 프로젝트 목록이 있을 때만 실행
    if (projectList.length === 0) {
      console.log('[공지사항] 프로젝트 목록이 비어있어 실행하지 않음');
      return;
    }
    
    const fetchNoticesForProjects = async () => {
      try {
        const projectIds = projectList.map(project => project.project_id);
        console.log('[공지사항] 프로젝트 ID 목록:', projectIds);
        
        const updatedProjects = [...projectList];
        
        for (let i = 0; i < projectIds.length; i++) {
          const projectId = projectIds[i];
          console.log(`[공지사항] 프로젝트 ${projectId} 공지사항 가져오기 시작`);
          
          try {
            const response = await fetch(`/api/announcements/project/${projectId}`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`[공지사항] 프로젝트 ${projectId} API 응답 데이터:`, data);
            
            if (data.success && data.notices) {
              // 백엔드 데이터 구조에 맞게 매핑
              const formattedNotices = data.notices.map(notice => ({
                id: notice.id,                    // 백엔드에서 보내는 그대로 사용
                title: notice.title,
                content: notice.content,
                author: notice.author,            // author_name이 아닌 author 사용
                createdAt: notice.createdAt,      // created_at이 아닌 createdAt 사용
                updatedAt: notice.updatedAt,      // updated_at이 아닌 updatedAt 사용
                views: notice.views
              }));

              updatedProjects[i] = {
                ...updatedProjects[i],
                notices: formattedNotices
              };
              
              console.log(`[공지사항] 프로젝트 ${projectId}의 공지사항 매핑 완료:`, formattedNotices);
            } else {
              console.log(`[공지사항] 프로젝트 ${projectId} 응답 실패 또는 공지사항 없음`);
              updatedProjects[i].notices = [];
            }
          } catch (error) {
            console.error(`[공지사항] 프로젝트 ${projectId}의 공지사항 로딩 실패:`, error);
            updatedProjects[i].notices = [];
          }
        }
        
        console.log('[공지사항] 모든 프로젝트 공지사항 업데이트 완료');
        setProjectList(updatedProjects);
      } catch (error) {
        console.error('[공지사항] 공지사항 로딩 실패:', error);
      }
    };
    
    fetchNoticesForProjects();
  }, [projectList.length]); // projectList가 변경될 때만 실행
  
  // 디버깅용: 전체 프로젝트 데이터 출력
  useEffect(() => {
    console.log('[디버깅] 현재 projectList 상태:', projectList);
  }, [projectList]);


  // 디버깅용: 컴포넌트 마운트 시 실행
  useEffect(() => {
    console.log('[디버깅] RootLayout 컴포넌트 마운트 완료');
  }, []);
  
  const [hoveredId, setHoveredId] = useState(null); // 현재 마우스 올린 프로젝트 id`
  const [projectToDeleteId, setProjectToDeleteId] = useState(null);
  const [finalRemoveCheckModal, setFinalRemoveCheckModal] = useState(false)

  const [creatNewProjectModal, setcreatNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectArticle, setNewProjectArticle] = useState('');

  
  const navItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '홈',
      onClick: () => navigate('/dashboard')
    },
    {
      key: 'project',
      icon: <FolderOpenOutlined />,
      label: 'Projects',
      children: [
        {
          key: 'add-project',
          label: (
            <div
              style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color:'blueviolet'}}
              onClick={() => setcreatNewProjectModal(true)}
            >
              New Project
              <i className="bx bx-plus" style={{ marginLeft: '5px', fontSize: '18px' }}></i>
            </div>
          ),
        }, // 프로젝트 생성을 위한 요소

        ...(projectList.length > 0 ?
        projectList.map((project) => ({
          key: project.project_id.toString(),
          label: (
            <div style={{display: 'flex', alignItems: 'center', paddingLeft: '5px'}} 
                 onMouseEnter={() => setHoveredId(project.project_id)}
                 onMouseLeave={() => setHoveredId(null)}>
              <span style={{minWidth: '100px', maxWidth: '100px', whiteSpace: 'nowrap',  overflow: 'hidden',  textOverflow: 'ellipsis',  display: 'inline-block', verticalAlign: 'middle'}}>
                {project.project_name}
              </span>
              <i className='bx bx-trash' 
                 style={{marginLeft: '0.3rem', fontSize: '16px', cursor: 'pointer', opacity: hoveredId === project.project_id ? 1 : 0, transition: 'opacity 0.2s'}}
                 onClick={()=>{
                   setProjectToDeleteId(project.project_id);
                   setFinalRemoveCheckModal(true);
                 }}
              ></i>
            </div>
          ),
          onClick: () => {
            console.log('프로젝트 클릭 시 전체 데이터:', project); // 디버깅용 로그 추가
            
            navigate(`/project/${project.project_id}`, {
              state: {
                project: {
                  project_id: project.project_id,
                  project_name: project.project_name,
                  description: project.description,
                  manager_id: project.manager_id,
                  manager_name: project.manager_name,
                  start_date: project.start_date,
                  end_date: project.end_date,
                  created_at: project.created_at,
                  updated_at: project.updated_at,
                  notices: project.notices  // notices 배열이 여기에 있는지 확인
                }
              }
            });
          }
        })) 
        : [
            {
              key: 'no-project',
              label: (
                <div style={{ paddingLeft: '5px', color: '#888' }}>
                  No project...
                </div>
              ),
            },
          ]
        )

      ]
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'History',
      onClick: () => navigate(`/history`),
    }
  ];

  const [collapsed, setCollapsed] = useState(true);
  const handleMouseEnter = () => {
    setCollapsed(false);
  };
  const handleMouseLeave = () => {
    setCollapsed(true);
  };

  const [finalCheckModal, setFinalCheckModal] = useState(false);
  const [warningModal, setWarningModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const alertRef = useRef(null);
  const hasUnreadNotifications = notifications.some(n => n.is_read === 0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('알림 가져오기 실패', err);
    }
  };

  useEffect(() => {
    fetchNotifications(); // 최초 1회 실행

    const interval = setInterval(() => {
      fetchNotifications(); // 10초마다 새로고침
    }, 10000); // 10000ms = 10초

    return () => clearInterval(interval); // 언마운트 시 정리
  }, []);


  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // 프론트 상태도 업데이트
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error('알림 읽음 처리 실패', err);
    }
  };


  const deleteNotification = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('알림 삭제 실패', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
        )
      );
      setNotifications([]); // 프론트 상태 비움
    } catch (err) {
      console.error('전체 알림 삭제 실패', err);
    }
  };

  
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setAlertModal(false);
      }
    };

    if (alertModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [alertModal]);

  // 5.29 작업 내용 // 5.28 작업 내용
  // 프로젝트 삭제 API 함수 추가
  const deleteProject = async (projectId) => {
    try {
      console.log('[프론트엔드] 프로젝트 삭제 시작:', { 
        projectId,
        currentUser: user,
        isAuthenticated: !!user
      });

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'  // 쿠키에 있는 JWT 토큰을 함께 전송
      });

      console.log('[프론트엔드] 삭제 요청 응답:', { 
        status: response.status, 
        statusText: response.statusText 
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[프론트엔드] 삭제 요청 실패:', errorData);
        throw new Error(errorData.message || '프로젝트 삭제에 실패했습니다.');
      }

      const result = await response.json();
      console.log('[프론트엔드] 삭제 요청 성공:', result);
      return true;
    } catch (error) {
      console.error('[프론트엔드] 프로젝트 삭제 중 오류 발생:', error);
      message.error('프로젝트 삭제에 실패했습니다.');
      return false;
    }
  };




  return (
    <OutterContainer>
      <SHeader>
        <div className="logo">Wiffle</div>
        {/*종 모양 아이콘 부분*/}
        <div className={alertStyles.alertContainer} ref={alertRef}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <BellOutlined onClick={() => setAlertModal(!alertModal)} style={{ fontSize: '20px' }} />
          {hasUnreadNotifications && (
            <span className={alertStyles.notificationDot}></span>
          )}
        </div>

          {alertModal && (
            <div className={alertStyles.alertDropdown}>
              <div className={alertStyles.alertHeader}>
                <h4 className={alertStyles.alertHeading}>🔔 알림</h4>
                {notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifications}
                    className={alertStyles.deleteAllButton}
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              <hr />
              <div className={alertStyles.alertList}>
                {notifications.length === 0 ? (
                  <div className={alertStyles.alertItem} style={{ textAlign: 'center', color: '#888' }}>
                    알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`${alertStyles.alertItem} ${n.is_read ? '' : alertStyles.unread}`}
                      onClick={() => markAsRead(n.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={alertStyles.alertTitleRow}>
                        <div className={alertStyles.alertTitle}>
                          📌 <strong>{n.title}</strong>
                        </div>
                        <button
                          className={alertStyles.deleteButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className={alertStyles.alertSub}>{n.message}</div>
                      <div className={alertStyles.alertSub} style={{ fontSize: '11px', color: '#aaa' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <UserBox>
          <ProfileImgBox>
            <UserOutlined />
          </ProfileImgBox>
          <div className="user-info">
            {user?.username} 님
          </div>
        </UserBox>
        <div className='kebab'>
            <MoreOutlined style={{ fontSize: '20px' }} onClick={() => setProfileModalVisible(true)} />
        </div>
      </SHeader>
      <InnerContainer>
        <SideNav
          collapsed={collapsed}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SMenu
              mode="inline"
              defaultSelectedKeys={['home']}
              style={{ height: '100%', borderRight: 0 }}
              items={navItems}
            />
          </div>
          <div style={{ borderTop: '1px solid #eee' }}>
            <LogoutButton onClick={handleLogout}>
              <span style={{marginRight:'5px'}}>Logout</span>
              <LogoutOutlined />
            </LogoutButton>
          </div>
        </SideNav>
        <MainContainer>
          <Outlet />
        </MainContainer>

        {/* History Sidebar Modal */}
        <Modal
          title="히스토리"
          open={isHistorySidebarOpen}
          onCancel={() => setIsHistorySidebarOpen(false)}
          footer={null}
          width={400}
          className={finalCheckModalStyles.historySidebar}
          style={{ top: 0, right: 0, position: 'fixed', height: '100vh', margin: 0 }}
        >
          <div className={finalCheckModalStyles.historyContent}>
            {/* 여기에 히스토리 내용을 추가할 수 있습니다 */}
            <p>최근 활동 내역이 여기에 표시됩니다.</p>
          </div>
        </Modal>

      </InnerContainer>

      {finalCheckModal && (
        <div className={finalCheckModalStyles.finalCheckModalOverlay}>
          <div className={finalCheckModalStyles.finalCheckModalContent}>
            <h2>로그아웃</h2> <hr />

            <div className={finalCheckModalStyles.main_text}>
              <h4>정말 로그아웃 하시겠습니까?</h4>
            </div>

            <div className={finalCheckModalStyles.modalButtonWrapper}>
              <button 
                id={finalCheckModalStyles.confirmButton} 
                onClick={async (e) => {
                  e.stopPropagation(); // 이벤트 버블링 방지
                  console.log('로그아웃 확인 버튼 클릭됨');
                  setFinalCheckModal(false);
                  console.log('로그아웃 시도');
                  
                  try {
                    const success = await logout();
                    console.log('로그아웃 함수 실행 완료:', success ? '성공' : '실패');
                    
                    if (success) {
                      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
                      window.location.href = '/login';
                    } else {
                      message.error('로그아웃 처리 중 오류가 발생했습니다.');
                    }
                  } catch (error) {
                    console.error('로그아웃 중 오류 발생:', error);
                    message.error('로그아웃 처리 중 오류가 발생했습니다.');
                  }
                }}
              >확인</button>
              <button id={finalCheckModalStyles.cancelButton} onClick={() => {setFinalCheckModal(false)}}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {finalRemoveCheckModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>프로젝트 삭제</h2>
            <hr />
            <div>
              <h4>삭제하면 다시 복구할 수 없습니다.</h4>
              <h4>이 프로젝트를 정말 삭제하겠습니까?</h4>
            </div>
            <div className={styles.modalButtonWrapper}>
              <button
                id={styles.confirmButton}
                onClick={async () => {
                  console.log('[RootLayout] 프로젝트 삭제 시작:', projectToDeleteId);
                  const success = await deleteProject(projectToDeleteId);
                  
                  if (success) {
                    // 즉시 UI에서 프로젝트 제거
                    setProjectList(prev => prev.filter(p => p.project_id !== projectToDeleteId));
                    console.log('[RootLayout] 프로젝트 목록에서 제거됨:', projectToDeleteId);
                    
                    // 성공 메시지 표시
                    message.success('프로젝트가 성공적으로 삭제되었습니다.');
                    
                    // 상태 초기화
                    setProjectToDeleteId(null);
                    setFinalRemoveCheckModal(false);
                    
                    // 대시보드로 이동
                    navigate('/dashboard');
                    
                    // 백그라운드에서 서버 목록 갱신 (UI는 이미 업데이트됨)
                    setTimeout(() => {
                      fetchProjectsFromServer();
                    }, 100);
                  } else {
                    console.error('[RootLayout] 프로젝트 삭제 실패');
                    message.error('프로젝트 삭제에 실패했습니다.');
                    // 삭제 실패 시 모달만 닫기
                    setProjectToDeleteId(null);
                    setFinalRemoveCheckModal(false);
                  }
                }}
              >
                확인
              </button>
              <button
                id={styles.cancelButton}
                onClick={() => setFinalRemoveCheckModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add project Modal */}
      {creatNewProjectModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent_0}>
              <h2>프로젝트 추가</h2> <hr/>
              <label htmlFor="project_title">제목: </label> <br/>
              <input type="text" name="project_title" id="project_title" placeholder="프로젝트 이름 입력" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}/> <br/>

              <label htmlFor="project_content">내용: </label> <br/>
              <textarea id="project_content" className={styles.textareaInput} placeholder="프로젝트 개요 입력" value={newProjectArticle} onChange={(e) => setNewProjectArticle(e.target.value)}></textarea> <br/>

     

              <div className={styles.modalButtonWrapper} style={{ marginTop: '1.5rem' }}>
                <button
                  id={styles.confirmButton}
                  onClick={async () => {
                    if (!newProjectName.trim() || !newProjectArticle.trim()) {
                      setWarningModal(true);
                      return;
                    }

                    try {
                      console.log('[디버그] 프로젝트 생성 시작');
                      console.log('[디버그] 요청 데이터:', {
                        project_name: newProjectName.trim(),
                        description: newProjectArticle,
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: null
                      });
                      
                      const response = await fetch('/api/projects', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          project_name: newProjectName.trim(),
                          description: newProjectArticle,
                          start_date: new Date().toISOString().split('T')[0],
                          end_date: null
                        }),
                      });

                      console.log('[디버그] 응답 상태:', response.status, response.statusText);
                      console.log('[디버그] 응답 헤더:', [...response.headers.entries()]);

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('[디버그] 응답 에러 본문:', errorText);
                        throw new Error(`프로젝트 생성 실패: ${response.status} - ${response.statusText}`);
                      }

                      const data = await response.json();
                      console.log('[서버] 프로젝트 생성 응답 데이터:', JSON.stringify(data, null, 2));

                      if (data.success) {
                        console.log('[디버그] 프로젝트 생성 성공');
                        console.log('[디버그] 프로젝트 데이터:', data.project);
                        // 로그 남기기
                        const logContent = `${user.username} 님이 "${data.project.project_name}" 프로젝트를 생성했습니다.`;

                        await fetch('/api/logs', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            project_id: data.project.project_id,
                            user_id: user.user_id,
                            content: logContent
                          })
                        });

                        // 프로젝트 생성 후 목록 갱신
                        await fetchProjectsFromServer();
                        
                        setNewProjectName('');
                        setNewProjectArticle('');
                        setcreatNewProjectModal(false);

                        // 새로 생성된 프로젝트로 이동
                        navigate(`/project/${data.project.project_id}`, {
                          state: {
                            project: data.project
                          }
                        });
                      } else {
                        console.log('[서버] 프로젝트 생성 실패:', data.message || '오류 메시지 없음');
                        console.log('[서버] 프로젝트 생성 실패 데이터:', JSON.stringify(data, null, 2));
                      }
                    } catch (error) {
                      console.error('[서버] 프로젝트 생성 오류:', error);
                      console.log('[서버] 프로젝트 생성 오류 데이터:', error.message);
                    }
                  }}
                >
                  추가
                </button>
                <button
                  id={styles.cancelButton}
                  onClick={() => {
                    setNewProjectName('');
                    setcreatNewProjectModal(false);
                  }}
                >
                  취소
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
                <h4>제목과 내용을 입력해주세요.</h4>
              </div>
  
              <div className={warningModalStyles.modalButtonWrapper}>
                <button id={warningModalStyles.confirmButton} onClick={() => {setWarningModal(false);}}>확인</button>
              </div>
            </div>
          </div>
        )}
        
      {/* Profile Settings Modal */}
      <ProfileSettingsModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          onSave={(newData) => {
            console.log('변경된 사용자 정보:', newData)
            setUser(newData);
          }}
          user={user}
        />

    </OutterContainer>
  )
}

export default RootLayout;

const OutterContainer = styled(Layout)`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  height: 100%;
`;

const InnerContainer = styled(Layout)`
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: calc(100vh - 90px);
  height: 100%;
  position: relative;
`;

const SHeader = styled(Header)`
  padding: 0 36px;
  width: 100%;
  min-width: 100vw;
  height: 90px;
  background-color: white;
  color: #454545;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #454545;
  border-radius: 0 0 20px 0;

  .logo {
    margin-right: auto;
    color: #659BFF;
    font-size: 25px;
    font-family: 'PlayfairBlack';
  }

  .alert {
    cursor: pointer;
  }

  .kebab {
    cursor: pointer;
  }
`;

const SideNav = styled(Sider)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 120vh;
  padding-top: 24px;
  background-color: white;
  position: relative;
  border-right: 1px solid #454545;
`;

const SMenu = styled(Menu)`
  font-family: 'PopinsMedium';

  & i {
    display: none;
  }

  & .bx {
    display: inline-block;
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: black;
  font-weight: 500;
  font-size: small;
`;

const MainContainer = styled.main`
  /* width: ${(props) => props.collapsed ? 'calc(100vw - 72px)' : 'calc(100vw - 188px)'} !important; */
  min-height: calc(100vh - 90px);
  background-color: white;
  padding: 40px;
  flex: 1;
  overflow: hidden;
`;

const ProfileImgBox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #454545;
  overflow: hidden;
  margin-right: 8px;
`;

const UserBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: 40px;
  border: 1px solid #454545;
  border-radius: 24px;
  padding: 0 16px;
`;