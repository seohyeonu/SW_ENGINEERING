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

  useEffect(() => {
    console.log('Project 컴포넌트 마운트');
    console.log('location.state:', location.state);
    console.log('project 데이터:', project);
    console.log('project.notices:', project?.notices);
  }, [location.state, project]);

  const tasks = project?.tasks || [
    {
      id: 1,
      title: 'Task 1',
      description: 'This is the first task',
      dueDate: '2023-03-15',
      status: 'in_progress',
      assignee: 'John Doe',
      priority: 'high',
      comments: [
        { id: 1, text: 'This is a comment' },
        { id: 2, text: 'This is another comment' },
      ],
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'This is the second task',
      dueDate: '2023-03-20',
      status: 'done',
      assignee: 'Jane Doe',
      priority: 'low',
      comments: [
        { id: 3, text: 'This is a comment for task 2' },
      ],
    },
  ];

  const notices = project?.notices || [];

  useEffect(() => {
    console.log('Notice 컴포넌트에 전달될 notices:', notices);
  }, [notices]);

  return (
    <main>
      <Title>
        <span className='main'>{project?.project_name || 'No Name'}</span>
        <span className='sub'>{project?.manager_name || '작성자 없음'}</span>
      </Title>
      <Container>
        <div className='left'>
          <Summary project={project} />
          <Notice 
            key={project?.project_id}
            projectId={project?.project_id} 
            notices={project?.notices || []}
          />
        </div>
        <div className='right'>
          <TodoList tasks={tasks} />
        </div>
      </Container>
      <MembersFloatingButton />
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