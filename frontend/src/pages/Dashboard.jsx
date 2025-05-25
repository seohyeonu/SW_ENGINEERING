import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Card, Avatar, Typography, Row, Col, Button, Checkbox, List, Badge } from 'antd'
import { UserOutlined, PlusOutlined } from '@ant-design/icons'
import { Calendar as AntdCalendar } from 'antd'
import styles from './css_folder/Dashboard.module.css'
import dayjs from 'dayjs'
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography

const initialTodoData = [
  { text: '명세서 제출하기', checked: true },
  { text: '테스트 계획서 제출하기', checked: true },
  { text: '인강 듣기', checked: true },
  { text: '자격증 공부', checked: true },
]

const initialProjectData = [
  {
    title: '웹앱 개발 프로젝트',
    desc: '팀 프로젝트로 웹앱 개발에 참여하여, Trello와 Jira와 같은 사이트를 제작해 보자.',
    img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80',
    members: 4,
  },
  {
    title: '졸업작품',
    desc: '졸업작품 주제 : 영화 추천 웹 서비스 개발',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    members: 3,
  }
]

const Dashboard = () => {
  const { user } = useAuthStore();
  
  const getRandomImageUrl = () => {
    return `https://picsum.photos/seed/${Math.floor(Math.random() * 99999)}/400/200`
  }

  const navigate = useNavigate()

  const [todoList, setTodoList] = useState(initialTodoData)
  const [calendarValue, setCalendarValue] = useState(dayjs())
  const [projects, setProjects] = useState(initialProjectData)
  const [creatNewProjectModal, setcreatNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectArticle, setNewProjectArticle] = useState('')

  const onCheck = (idx) => {
    setTodoList(list =>
      list.map((item, i) =>
        i === idx ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const dailyComments = [
    "안녕하세요 코딩하기 좋은 하루입니다.",
    "오늘도 화이팅입니다!",
    "작은 성취도 큰 한 걸음입니다.",
    "꾸준히 나아가는 여러분을 응원합니다.",
    "오늘도 멋진 하루 보내세요!",
    "에러도 배움의 일부입니다 :)",
  ];
  const [dailyComment, setDailyComment] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dailyComments.length);
    setDailyComment(dailyComments[randomIndex]);
  }, []);
  
  return (
    <MainContainer>
      <RowBox>
        <ProfileCardWrapper bodyStyle={{ display: 'flex', flexDirection: 'row', height: '100%', padding: 0 }}>
          <ProfileLeft>
            <Avatar size={140} icon={<UserOutlined />} style={{ marginBottom: 8, background: '#f5f5f5', boxShadow: '0 8px 24px 0 rgba(31,38,135,0.10)' }} />
            <ProfileName>{user.username}</ProfileName>
            <ProfileJob>{user.department}</ProfileJob>
          </ProfileLeft>
          <ProfileRight>
            <ProfileInfoTitle>Daily Comment</ProfileInfoTitle>
            <ProfileDesc>
              {dailyComment.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </ProfileDesc>
            <ProfileLine />
            <ProfileInfoList>
              <span>Name:</span> {user.name}<br />
              <span>Phone:</span> {user.phone}<br />
              <span>Email:</span> {user.email}
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
          <Card className={styles.todoCard} bodyStyle={{ padding: 0, height: '100%' }}>
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
            bodyStyle={{ padding: 24 }}
          >
            <div className={styles.projectScrollWrapper}>
              <div className={styles.projectCardItem} onClick={() => setcreatNewProjectModal(true)}>
                <Card hoverable className={styles.emptyProjectCard} bodyStyle={{ height: 120 }}>
                  <PlusOutlined />
                </Card>
              </div>

              {projects.map((project, idx) => (
                <div key={idx} className={styles.projectCardItem}>
                  <Card
                    hoverable
                    cover={<img alt={project.title} src={project.img} className={styles.projectImage} />}
                    className={styles.projectItem}
                    bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}
                  >
                    <Title level={5} style={{ margin: 0 }}>{project.title}</Title>
                    <Text className={styles.projectDesc}>{project.desc}</Text>
                    <div className={styles.cardButtonWrapper}>
                      <Button size="small" type="primary" style={{ textAlign: 'center', fontSize: '0.75rem', padding: '10px' }}
                      onClick={()=>{
                        // 이동은 되는데 여기에 해당 프로젝트 맞게 데이터 넘기고 추가하기만 하면 됨.
                        navigate('/project/1')
                      }}>
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

            <label htmlFor="project_writer">작성자: </label> <br />
            <input
              type="text"
              id="project_writer"
              value="작성자 정보 필요"
              readOnly
            /> <br />

            <div className={styles.modalButtonWrapper} style={{ marginTop: '1.5rem' }}>
              <button
                id={styles.confirmButton}
                onClick={() => {
                  const newProject = {
                    title: newProjectName.trim(),
                    desc: newProjectArticle,
                    img: getRandomImageUrl(), // getRandomImageUrl() 안전한 공식 사이트에서 이미지 가져오는 함수.
                    members: 0
                  }
                  setProjects(prev => [...prev, newProject])
                  setNewProjectName('')
                  setNewProjectArticle('')
                  setcreatNewProjectModal(false)
                }}
              >
                추가
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
  justify-content: center;         /* 콘텐츠 가운데 */
  align-items: center;             /* 수직 가운데 */
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
  margin: auto 165px auto auto; /* 왼쪽 여백 없음, 오른쪽 여백 있음 */
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