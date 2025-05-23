import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'
import finalCheckModalStyles from './RootLayout.module.css'
import alertStyles from './AlertDropdown.module.css'
import { Breadcrumb, Layout, Menu } from 'antd';
import { UserOutlined, HomeOutlined, FolderOpenOutlined, BellOutlined, MoreOutlined, LogoutOutlined  } from '@ant-design/icons';
import { Header } from 'antd/es/layout/layout'
import Sider from 'antd/es/layout/Sider'
import styles from './RootLayoutOfModal.module.css'

const RootLayout = () => {
  console.log('=== RootLayout 컴포넌트 렌더링 시작 ===');
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

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

  /*
  // 이전 하드코딩된 데이터 (참고용)
  const oldProjectData = [
    {
      id: '5',  //project id 
      name: '프로젝트 Alpha', //project title
      article: 'Alpha 프로젝트 설명', // project description
      author: 'User1', // project manager_id = user.id  조인해서 u.name 가져오기
      
      //업무 테이블에서 가져오기
      tasks: [
        {
          id: 1,
          title: 'Alpha 서버 연동',
          members: ['User1'],
          dueDate: '2025-06-01',
          content: 'Alpha API 연동',
          createdAt: '2025-05-21',
          updatedAt: '2025-05-21',
          views: 0,
        }
      ],

      //공지 테이블에서 가져오기
      notices: [
      ]
    }, // 플젝1에 대한 내용
    {
      id: 2,
      name: '프로젝트 Beta',
      article: 'Beta 프로젝트 설명',
      author: 'User2',
      tasks: [
        {
          id: 1,
          title: 'Beta 디자인',
          members: ['User3'],
          dueDate: '2025-06-03',
          content: 'Figma 작업',
          createdAt: '2025-05-21',
          updatedAt: '2025-05-22',
          views: 0,
        }
      ],
      notices: []
    } // 플젝2에 대한 내용
  ];
*/


  // 1. 프로젝트 목록 가져오기 - 서버에서 실제 데이터 가져오기
  useEffect(() => {
    // 서버에서 프로젝트 목록 가져오기
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
    
    // 서버에서 프로젝트 목록 가져오기 실행
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
      label: 'Home',
      onClick: () => navigate('/dashboard'),
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
  ];

  const [collapsed, setCollapsed] = useState(true);
  const handleMouseEnter = () => {
    setCollapsed(false);
  };
  const handleMouseLeave = () => {
    setCollapsed(true);
  };

  const [finalCheckModal, setFinalCheckModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const alertRef = useRef(null);
  
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

  return (
    <OutterContainer>
      <SHeader>
        <div className="logo">Wiffle</div>
        {/*종 모양 아이콘 부분*/}
        <div className={alertStyles.alertContainer} ref={alertRef}>
          <BellOutlined style={{ fontSize: '20px' }} onClick={() => setAlertModal(!alertModal)} />

          {alertModal && (
            <div className={alertStyles.alertDropdown}>
              <h4>🔔 알림</h4>
              <hr />

              <div className={alertStyles.alertList}>
                <div className={alertStyles.alertItem}>
                  <div className={alertStyles.alertTitle}>
                    📌 <strong>서버 및 연동하기</strong>
                  </div>
                  <div className={alertStyles.alertSub}>마감까지 <span className={alertStyles.alertDeadline}>D-1</span></div>
                </div>

                <div className={alertStyles.alertItem}>
                  <div className={alertStyles.alertTitle}>
                    🗨️ <strong>User 2</strong> 님이 <strong>project2</strong> 글에 댓글을 남겼습니다.
                  </div>
                  <div className={alertStyles.alertSub}>"정말 괜찮은데요!"</div>
                </div>

                <h5 className={alertStyles.sectionTitle}>📅 이번 주 나의 업무</h5>
                <table className={alertStyles.alertTable}>
                  <thead>
                    <tr>
                      <th>프로젝트</th>
                      <th>날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>명세서 작성하기</td>
                      <td>07-20(Tue) 09:00 <span className={alertStyles.alertDeadline}>D-2</span></td>
                    </tr>
                  </tbody>
                </table>
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
          <MoreOutlined style={{ fontSize: '20px' }} />
        </div>
      </SHeader>
      <InnerContainer>
        <SideNav
          collapsed={collapsed}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SMenu
            mode="inline"
            defaultSelectedKeys={['home']}
            style={{ height: '100%', borderRight: 0 }}
            items={navItems}
          />
          <LogoutButton className={finalCheckModalStyles.LogoutButton} onClick={handleLogout}>
            <span>Logout</span>
            <LogoutOutlined/>
          </LogoutButton>
        </SideNav>
        <MainContainer>
          <Outlet />
        </MainContainer>
      
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
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 버블링 방지
                  console.log('로그아웃 확인 버튼 클릭됨');
                  setFinalCheckModal(false);
                  console.log('로그아웃 시도');
                  try {
                    logout();
                    console.log('로그아웃 함수 실행 완료');
                  } catch (error) {
                    console.error('로그아웃 중 오류 발생:', error);
                  }
                  
                  // 리다이렉트 전에 충분한 시간을 두어 로그가 표시되도록 함
                  setTimeout(() => {
                    console.log('로그인 페이지로 리다이렉트 시작');
                    window.location.href = '/login';
                  }, 1500);
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
                onClick={() => {
                  setProjectList(prev => prev.filter(p => p.id !== projectToDeleteId));
                  setProjectToDeleteId(null); // 초기화
                  setFinalRemoveCheckModal(false);
                  navigate('/dashboard');
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

              <label htmlFor="project_writer">작성자: </label> <br/>
              <input type="text" name="project_writer" id="project_writer" value={user?.username} readOnly/> <br/>

              <div className={styles.modalButtonWrapper} style={{ marginTop: '1.5rem' }}>
                <button
                  id={styles.confirmButton}
                  onClick={async () => {
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

                        const newProject = {
                          id: data.project.project_id.toString(),
                          name: data.project.project_name,
                          article: data.project.description,
                          start_date: data.project.start_date || new Date().toISOString().split('T')[0],
                          end_date: data.project.end_date
                        };
                        
                        console.log('[디버그] 새 프로젝트 객체:', newProject);

                        setProjectList(prev => [...prev, newProject]);
                        setNewProjectName('');
                        setcreatNewProjectModal(false);

                        navigate(`/project/${data.project.project_id}`, {
                          state: {
                            project: newProject
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
  /* width: ${(props) => props.collapsed ? '72px' : '188px'} !important;
  min-width: ${(props) => props.collapsed ? '72px' : '188px'} !important;
  max-width: ${(props) => props.collapsed ? '72px' : '188px'} !important; */
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
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  cursor: pointer;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  outline: none;
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