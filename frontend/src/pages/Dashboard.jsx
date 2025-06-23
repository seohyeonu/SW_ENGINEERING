import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Card, Avatar, Typography, Row, Col, Button, Checkbox, List, Badge } from 'antd'
import { UserOutlined, PlusOutlined } from '@ant-design/icons'
import { Calendar as AntdCalendar } from 'antd'
import styles from './css_folder/Dashboard.module.css'
import warningModalStyles from '../common/RootLayout.module.css'
import dayjs from 'dayjs'
import { useAuthStore } from '../store/authStore';
import Cookies from 'js-cookie'

const { Title, Text } = Typography


const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 11자리 전화번호 형식으로 변환 (010-XXXX-XXXX)
  if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  return phone; // 형식이 맞지 않으면 원본 반환
};

const initialTodoData = [

]

const initialProjectData = [

]

const Dashboard = () => {
  const getRandomImageUrl = () => {
    return `https://picsum.photos/seed/${Math.floor(Math.random() * 99999)}/400/200`
  }

  const { user } = useAuthStore();
  const navigate = useNavigate()

  const [todoList, setTodoList] = useState(initialTodoData)
  const [calendarValue, setCalendarValue] = useState(dayjs())
  const [projects, setProjects] = useState(initialProjectData)
  const [creatNewProjectModal, setcreatNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectArticle, setNewProjectArticle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [warningModal, setWarningModal] = useState(false)

  // 유저 프로필 정보 가져오기
  const [userProfile, setUserProfile] = useState({
    name: '',
    phone: '',
    email: '',
    job_position: '',
    description: ''
  })

  const fetchUserProfile = async () => {
    try {
      console.log('Frontend - 프로필 정보 요청 시작');

      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include' // 쿠키를 포함하여 요청
      });

      console.log('Frontend - API 응답 상태:', response.status);
      const data = await response.json();
      console.log('Frontend - 받은 프로필 데이터:', data);

      if (data.success) {
        console.log('Frontend - 프로필 데이터 설정:', data.user);
        setUserProfile(data.user);
      } else {
        console.error('Frontend - 프로필 데이터 오류:', data.message);
      }
    } catch (error) {
      console.error('Frontend - 프로필 조회 실패:', error);
    }
  };



  const fetchTodoList = async () => {
    try {
      const response = await fetch('/api/tasks/today', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Frontend - 받은 태스크 목록 데이터:', data)

      if (data.success) {
        // 서버에서 이미 올바른 형식으로 데이터가 오고 있으므로 직접 설정
        setTodoList(data.tasks)
      } else if (data.message === '업무를 찾을 수 없습니다.') {
        console.log('Frontend - 할일이 없습니다');
        setTodoList([]) // 빈 배열로 설정
      } else {
        console.error('Frontend - 태스크 목록 데이터 오류:', data.message)
        setTodoList([]) // 다른 에러의 경우도 빈 배열로 설정
      }
    } catch (error) {
      console.error('Frontend - 태스크 목록 조회 실패:', error)
      setTodoList([]) // 에러 시 빈 배열로 설정
    }
  }



  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('프로젝트 목록 조회 실패');
      }

      const data = await response.json();
      if (data.success) {
        // 받아온 프로젝트 데이터를 현재 형식에 맞게 변환
        const formattedProjects = data.projects.map(project => ({
          title: project.project_name,
          desc: project.description,
          img: getRandomImageUrl(), // 또는 project.image_url 등 실제 이미지 URL
          members: project.member_count || 0,
          project_id: project.project_id
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('프로젝트 목록 조회 오류:', error);
    }
  };


  useEffect(() => {
    fetchUserProfile();
    fetchTodoList();
    fetchProjects();
  }, []);

  const onCheck = (idx) => {
    setTodoList(list =>
      list.map((item, i) =>
        i === idx ? { ...item, checked: !item.checked } : item
      )
    )
  }

  return (
    <MainContainer>
      <RowBox>
        <ProfileCardWrapper styles={{ body: { display: 'flex', flexDirection: 'row', height: '100%', padding: 0 } }}>
          <ProfileLeft>
            <Avatar size={140} icon={<UserOutlined />} />
            <ProfileName>{user?.username || '이름 없음'}</ProfileName>
            <ProfileJob>{user?.department || '직무 정보 없음'}</ProfileJob>
          </ProfileLeft>
          <ProfileRight>
            <ProfileInfoTitle>Profile Information</ProfileInfoTitle>
            <ProfileDesc>{user?.description || '사용자 소개가 없습니다.'}</ProfileDesc>
            <ProfileLine />
            <ProfileInfoList>
              <span>Name:</span> {user?.name || '-'}<br />
              <span>Phone:</span> {formatPhoneNumber(user?.phone) || '-'}<br />
              <span>Email:</span> {user?.email || '-'}
            </ProfileInfoList>
          </ProfileRight>
        </ProfileCardWrapper>

        <Col flex="4" className={styles.calendarWrapper}>
          <div className={styles.customCalendar}>
            <AntdCalendar
              fullscreen={false}
              value={calendarValue}
              onChange={(newValue) => setCalendarValue(dayjs(newValue))}
              headerRender={({ value, onChange }) => (
                <div className={styles.calendarHeader}>
                  <Button className={styles.calendarNavButton} onClick={() => onChange(value.subtract(1, 'month'))}>{'<'}</Button>
                  <span className={styles.calendarTitle}>{value.format('MMMM, YYYY')}</span>
                  <Button className={styles.calendarNavButton} onClick={() => onChange(value.add(1, 'month'))}>{'>'}</Button>
                </div>
              )}
            />
          </div>
        </Col>
      </RowBox>

      <RowBox>
        <Col flex="3">
          <Card className={styles.todoCard} styles={{ body: { padding: 0, height: '100%' } }}>
            <div className={styles.todoHeader}>
              <span className={styles.todoTitle}>
                TODAY - TASK
                <Badge count={todoList.length} className={styles.todoBadge} />
              </span>
            </div>

            <div className={styles.todoScrollBox}>
              <List
                dataSource={todoList}
                renderItem={(item, idx) => (
                  <List.Item className={styles.todoItem}>
                    <Checkbox checked={item.checked} onChange={() => onCheck(idx)} className={styles.todoCheckbox}>
                      <span className={item.checked ? styles.todoTextChecked : styles.todoText}>
                        {item.text}
                      </span>
                    </Checkbox>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col flex="7">
          <Card
            className={styles.projectCard}
            title={
              <span className={styles.projectTitle}>
                Projects <span className={styles.projectSubtitle}>Architects design houses</span>
              </span>
            }
            styles={{ body: { padding: 24 } }}
          >
            <div className={styles.projectScrollWrapper}>
              <div className={styles.projectCardItem} onClick={() => setcreatNewProjectModal(true)}>
                <Card hoverable className={styles.emptyProjectCard}>
                  <div className={styles.plusCenterBox}>
                    <PlusOutlined />
                  </div>
                </Card>
              </div>

              {projects.map((project, idx) => (
                <div key={idx} className={styles.projectCardItem}>
                  <Card
                    hoverable
                    cover={<img alt={project.title} src={project.img} className={styles.projectImage} />}
                    className={styles.projectItem}
                    styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' } }}
                  >
                    <Title level={5} style={{ margin: 0 }}>{project.title}</Title>
                    <Text className={styles.projectDesc}>{project.desc}</Text>
                    <div className={styles.memberCount}>
                      👥 {project.members}명 참여 중
                    </div>
                    <div className={styles.cardButtonWrapper}>
                      <Button
                        size="small"
                        type="primary"
                        style={{ textAlign: 'center', fontSize: '0.75rem', padding: '10px' }}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/projects/${project.project_id}`, {
                              method: 'GET',
                              credentials: 'include',
                            });
                            const data = await res.json();

                            if (data.success && data.project) {
                              navigate(`/project/${project.project_id}`, {
                                state: { project: data.project },
                              });
                            } else {
                              console.error('프로젝트 데이터 없음');
                            }
                          } catch (err) {
                            console.error('프로젝트 불러오기 실패:', err);
                          }
                        }}
                      >
                        VIEW ALL
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </RowBox>
      
      {creatNewProjectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent_0}>
            <h2>프로젝트 추가</h2>
            <hr />
            <label htmlFor="project_title">제목: </label> <br />
            <input
              type="text"
              name="project_title"
              id="project_title"
              placeholder="프로젝트 이름 입력"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            /> <br />

            <label htmlFor="project_content">내용: </label> <br />
            <textarea
              id="project_content"
              className={styles.textareaInput}
              placeholder="프로젝트 개요 입력"
              value={newProjectArticle}
              onChange={(e) => setNewProjectArticle(e.target.value)}
            /> <br />


            <div className={styles.modalButtonWrapper} style={{ marginTop: '1.5rem' }}>
            <button
                id={styles.confirmButton}
                onClick={async () => {
                  if (!newProjectName.trim() || !newProjectArticle.trim()) {
                    setWarningModal(true);
                    return;
                  }
                  
                  try {
                    setIsCreating(true)
                    const projectData = {
                      project_name: newProjectName.trim(),
                      description: newProjectArticle,
                      start_date: new Date().toISOString().split('T')[0],
                      end_date: null
                    }

                    const response = await fetch('/api/projects', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify(projectData),
                    });

                    if (!response.ok) {
                      throw new Error(`프로젝트 생성 실패: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    if (data.success) {
                      // 새 프로젝트 객체를 미리 생성
                      const newProject = {
                        title: projectData.project_name,
                        desc: projectData.description,
                        img: getRandomImageUrl(),
                        members: 0,
                        project_id: data.project.project_id
                      }

                      // 상태 업데이트를 한 번에 처리
                      setProjects(prev => [...prev, newProject])
                      setNewProjectName('')
                      setNewProjectArticle('')
                      setcreatNewProjectModal(false)

                      try {
                        const logContent = `${user.username} 님이 "${projectData.project_name}" 프로젝트를 생성했습니다.`;

                        await fetch('/api/logs', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            project_id: data.project.project_id,
                            user_id: user.user_id,
                            content: logContent
                          }),
                        });

                        console.log('[프론트] 프로젝트 생성 로그 전송 완료');
                      } catch (logErr) {
                        console.error('[프론트] 로그 전송 실패:', logErr);
                      }

                      // RootLayout의 프로젝트 목록 갱신을 위한 커스텀 이벤트 발생
                      window.dispatchEvent(new CustomEvent('refreshProjectList'));

                      // 약간의 지연 후 페이지 이동
                      setTimeout(() => {
                        navigate(`/project/${data.project.project_id}`, {
                          state: { project: data.project }
                        });

                        window.location.reload();
                      }, 200); // 지연 시간을 200ms로 증가
                    }
                  } catch (error) {
                    console.error('[서버] 프로젝트 생성 오류:', error)
                  } finally {
                    setIsCreating(false)
                  }
                }}
              >
                {isCreating ? '생성 중...' : '추가'}
              </button>
              <button
                id={styles.cancelButton}
                onClick={() => {
                  setNewProjectName('')
                  setNewProjectArticle('')
                  setcreatNewProjectModal(false)
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
    </MainContainer>
  )
}

export default Dashboard

const MainContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #fff;
`

const RowBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 16px;
`

const ProfileCardWrapper = styled(Card)`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1100px;
  width: 65%;
  height: 340px;
  padding: 0 !important;
  border-radius: 28px !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10) !important;
  background: #fff !important;
  border: none !important;
  margin-bottom: 32px;
`

const ProfileLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto 165px auto auto;
  width: 260px;
  height: 100%;
`

const ProfileRight = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 160px;
`

const ProfileName = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #222;
  margin-top: 18px;
  margin-bottom: 0;
`

const ProfileJob = styled.div`
  font-size: 16px;
  color: #888;
  margin-bottom: 18px;
`

const ProfileInfoTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #222;
`

const ProfileDesc = styled.div`
  color: #222;
  font-size: 15px;
  margin-bottom: 12px;
  line-height: 1.5;
`

const ProfileLine = styled.div`
  width: 100%;
  height: 1px;
  background: #e5e5e5;
  margin: 10px 0 16px 0;
`

const ProfileInfoList = styled.div`
  font-size: 15px;
  color: #222;
  line-height: 2;
  span {
    font-weight: 700;
    margin-right: 8px;
  }
`