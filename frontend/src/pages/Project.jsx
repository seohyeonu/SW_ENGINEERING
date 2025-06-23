import React, { useEffect } from 'react'
import styled from 'styled-components'
import Summary from '../components/project/Summary'
import Notice from '../components/project/Notice'
import TodoList from '../components/project/TodoList'
import { useLocation } from 'react-router-dom';
import MembersFloatingButton from '../components/project/MembersFloatingButton'

const Project = () => {
  const location = useLocation();
  const { project } = location.state || {};
  const tasks = project?.tasks || [];
  const notices = project?.notices || [];
  const members = project?.members || [];
  const teamMap = project?.teamMap || {};
  const logs = project?.logs || [];

  useEffect(() => {
    console.log('Project 컴포넌트 마운트');
    console.log('location.state:', location.state);
    console.log('project 데이터:', project);
    console.log('project.notices:', project?.notices);
    
    // project가 없으면 대시보드로 리다이렉트
    if (!project || !project.project_id) {
      console.error('Project 데이터가 없습니다. 대시보드로 이동합니다.');
      window.location.href = '/dashboard';
      return;
    }
  }, [location.state, project]);

  useEffect(() => {
    console.log('Notice 컴포넌트에 전달될 notices:', notices);
  }, [notices]);

  // project가 없으면 로딩 상태 표시
  if (!project || !project.project_id) {
    return (
      <main>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>프로젝트 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Title>
        <span className='main'>{project?.project_name || 'No Name'}</span>
        <span className='sub'>{project?.manager_name || '작성자 없음'}</span>
      </Title>
      <Container>
        <div className='left'>
          <Summary project={project} />
          <Notice notices={notices} projectId={project?.project_id}/>
        </div>
        <div className='right'>
          <TodoList projectId={project?.project_id} tasks={tasks} members={members} teamMap={teamMap} />
        </div>
      </Container>
      <MembersFloatingButton projectId={project?.project_id} />
    </main>
  );
};

export default Project;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  gap: 145px;
  .left {
    display: flex;
    flex-direction: column;
    gap: 96px;
    /* justify-content: space-between; */
    flex: 5;
  }
  .right {
    flex: 2;
  }
`

const Title = styled.div`
  margin-bottom: 48px;
  color: #454545;
  .main {
    font-family: 'PopinsBold';
    font-size: 36px;
    margin-right: 24px;
  }
  .sub {
    font-size: 16px;
  }
`