import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { PlusOutlined, EllipsisOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Dropdown, Menu } from 'antd'
import modalStyles from './css_folder/Task.module.css'
import finalCheckModalStyles from './css_folder/finalCheckModal.module.css'
import dragStyles from './css_folder/DragDropStyles.module.css'
import styles from './css_folder/ViewModal.module.css'
import warningModalStyles from '../../common/RootLayout.module.css'
import { Header, CardList, Card } from './css_folder/TodoList.styles';
import { useParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuthStore } from '../../store/authStore';

const TodoList = ({ tasks, members: allMembers, teamMap }) => {
  const { user } = useAuthStore();
  // URL에서 projectId 가져오기

  const fetchProjectTitle = async (projectId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.project) {
        return data.project.project_name;
      } else {
        throw new Error('프로젝트 이름을 가져오지 못했습니다.');
      }
    } catch (err) {
      console.error('프로젝트 이름 fetch 실패:', err);
      return '알 수 없음 프로젝트';
    }
  };

  const location = useLocation();
  const projectIdFromUrl = location.pathname.split('/').pop();
  const { projectId: paramProjectId } = useParams();
  const projectId = paramProjectId || projectIdFromUrl;

  const [todoList, setTodoList] = useState(tasks || []);
  const [warningModal, setWarningModal] = useState(false);
  
  // projectId 변경 시 로깅
  useEffect(() => {
    console.log('TodoList - projectId 정보:', {
      projectId: projectId,
      paramProjectId: paramProjectId,
      projectIdFromUrl: projectIdFromUrl,
      pathname: location.pathname,
      paramType: typeof projectId
    });
  }, [projectId, paramProjectId, projectIdFromUrl, location]);
  
  // API 호출을 위한 기본 설정
  const getHeaders = () => ({
    'Content-Type': 'application/json'
  });

  // 업무 목록 조회 함수
  const fetchTasks = async () => {
    if (!projectId) {
        console.error('TodoList - 프로젝트 ID가 없습니다.');
        return;
    }

    try {
        console.log('TodoList - 업무 목록 조회 요청:', {
            projectId: projectId,
            paramType: typeof projectId
        });

        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('TodoList - 업무 목록 조회 응답 전체:', data);
        
        if (response.ok && data.success) {
            // 각 업무의 담당자 정보를 자세히 로깅
            data.tasks.forEach(task => {
                console.log(`Task ${task.task_id} 담당자 정보:`, {
                    assignees: task.assignees,
                    assignee_details: task.assignee_details,
                    raw_task: task
                });
            });
            
            setTodoList(data.tasks);
        } else {
            throw new Error(data.message || '업무 목록 조회에 실패했습니다.');
        }
    } catch (error) {
        console.error('TodoList - 업무 목록 조회 실패:', error);
    }
  };

  // 컴포넌트 마운트 시 업무 목록 조회
  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  // 업무 추가 모달
  const [addTaskModal, setAddTaskModal] = useState(false);

  // 담당인원 관련 상태
  const [selectedTeam, setSelectedTeam] = useState('개발팀');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // 선택된 팀의 멤버 목록 조회
  const fetchTeamMembers = async (team) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${team}`, {
        headers: getHeaders(),
        credentials: 'include' // 쿠키 포함
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`${team} 멤버 목록:`, data.members);
        setTeamMembers(data.members);
      } else {
        console.error('팀 멤버 조회 실패:', data.message);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('팀 멤버 조회 오류:', error);
      setTeamMembers([]);
    }
  };

  // 팀 변경시 멤버 목록 갱신
  useEffect(() => {
    if (projectId && selectedTeam) {
      fetchTeamMembers(selectedTeam);
    }
  }, [projectId, selectedTeam]);

  // 업무 생성 시 선택된 멤버들의 user_id 추출
  const getSelectedMemberIds = () => {
    return selectedMembers.map(selectedName => {
      const member = teamMembers.find(m => m.name === selectedName);
      return member ? member.user_id : null;
    }).filter(id => id !== null);
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !taskContent.trim() || selectedMembers.length === 0) {
      setWarningModal(true);
      return;
    }
    
    try {
        // 전체 멤버 목록을 가져옴
        const response = await fetch(`/api/projects/${projectId}/members/all`, {
            headers: getHeaders(),
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('멤버 목록을 가져오는데 실패했습니다.');
        }

        // 전체 멤버 목록에서 선택된 멤버들의 ID 찾기
        const assigneeIds = selectedMembers.map(memberName => {
            const member = data.members.find(m => m.name === memberName);
            return member ? member.id : null;
        }).filter(id => id !== null);

        const taskData = {
            project_id: parseInt(projectId),
            title: taskTitle,
            content: taskContent,
            priority: importance,
            status: 'not_started',
            dueDate: taskDeadline,
            assignees: assigneeIds
        };

        console.log('업무 생성 요청 데이터:', taskData);
        console.log('선택된 담당자들:', {
            names: selectedMembers,
            ids: assigneeIds
        });

        const taskResponse = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });

        const taskResult = await taskResponse.json();
        console.log('업무 생성 응답:', taskResult);

        if (taskResponse.ok && taskResult.success) {
            // 기존 로그 저장 로직 유지
            const projectTitle = await fetchProjectTitle(projectId);
            const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트에 "${taskTitle}" 업무를 생성했습니다.`;

            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    project_id: parseInt(projectId),
                    user_id: user.user_id,
                    content: logContent
                })
            });

            await fetchTasks();
            setAddTaskModal(false);
            resetForm();
        } else {
            throw new Error(taskResult.message || '업무 생성에 실패했습니다.');
        }
    } catch (error) {
        console.error('업무 생성 실패:', error);
        alert(error.message);
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskContent('');
    setSelectedMembers([]);
    setSelectedTeam('개발팀');
    setTaskDeadline(new Date().toISOString().split('T')[0]);
    setImportance('low');
  };

  // 업무 수정/삭제 관련 상태
  const [finalRemoveCheckModal, setFinalRemoveCheckModal] = useState(false);
  const [editTaskModal, setEditTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [importance, setImportance] = useState('middle');
  const [taskWriter, setTaskWriter] = useState('');
  const [taskDeadline, setTaskDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('not_started');

  // 더보기 모달
  const [viewTaskModal, setViewTaskModal] = useState(false);
  const [taskToView, setTaskToView] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);  // 댓글 목록을 위한 상태 추가

  // 시간 표시 리렌더링용
  const [renderTrigger, setRenderTrigger] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 상태 변경 처리
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // === 상태 변경 전 사용자 확인 ===
      const changedTask = todoList.find(task => task.task_id === taskId);
      if (!changedTask) throw new Error('해당 업무를 찾을 수 없습니다.');

      // 상태가 이미 COMPLETED면 차단
      if (changedTask.status.toUpperCase() === 'COMPLETED') {
        alert('이미 완료된 업무는 상태를 변경할 수 없습니다.');
        return;
      }
      
      const statusKorean = {
        NOT_STARTED: '진행 전',
        IN_PROGRESS: '진행 중',
        COMPLETED: '완료'
      };

      const displayStatus = statusKorean[newStatus.toUpperCase()] || newStatus;
      const confirmed = window.confirm(
        `"${changedTask?.title || '해당 업무'}"의 상태를 '${displayStatus}'로 변경하시겠습니까?`
      );

      if (!confirmed) return;

      // === 실제 상태 변경 ===
      console.log('업무 상태 변경 요청:', { taskId, newStatus });
      
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus.toUpperCase() })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 로컬 상태 업데이트
        const updatedList = todoList.map(task =>
          task.task_id === taskId ? { ...task, status: newStatus.toUpperCase() } : task
        );
        setTodoList(updatedList);

        // 상세 보기 모달이 열려있는 경우 해당 데이터도 업데이트
        if (taskToView && taskToView.task_id === taskId) {
          setTaskToView(prev => ({ ...prev, status: newStatus.toUpperCase() }));
        }

        // === 로그 추가 ===
        const changedTask = todoList.find(task => task.task_id === taskId);
        if (changedTask && user) {
          const projectTitle = await fetchProjectTitle(changedTask.project_id);
          const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${changedTask.title}" 업무 상태를 "${newStatus.toUpperCase()}"(으)로 변경했습니다.`;

          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              project_id: changedTask.project_id,
              user_id: user.user_id,
              content: logContent
            })
          });
        }

      } else {
        throw new Error(data.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 상태 변경 버튼 클릭 핸들러 수정
  const getNextStatus = (currentStatus) => {
    switch (currentStatus.toUpperCase()) {
      case 'NOT_STARTED':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'COMPLETED';
      case 'COMPLETED':
        return 'NOT_STARTED';
      default:
        return 'NOT_STARTED';
    }
  };

  // 상태 표시 텍스트 변환 함수
  const getStatusDisplay = (status) => {
    switch (status.toUpperCase()) {
      case 'NOT_STARTED':
        return '진행 전';
      case 'IN_PROGRESS':
        return '진행 중';
      case 'COMPLETED':
        return '완료';
      default:
        return '진행 전';
    }
  };

  // 수정/삭제 메뉴 아이템 정의만 task_id로 수정
  const actionMenuItems = (taskId) => [
    {
      key: 'edit',
      label: '수정하기',
      onClick: () => handleMenuClick('edit', taskId)
    },
    {
      key: 'delete',
      label: '삭제하기',
      onClick: () => handleMenuClick('delete', taskId)
    }
  ];

  // 메뉴 클릭 핸들러
  const handleMenuClick = async (action, taskId) => {
    console.log('Menu clicked:', action, taskId);
    const task = todoList.find((t) => t.task_id === taskId);
    if (!task) {
        console.log('Task not found:', taskId);
        return;
    }

    if (action === 'edit') {
        try {
            // 선택된 팀의 멤버 목록을 가져옴 (드래그 목록 표시용)
            await fetchTeamMembers(selectedTeam || '개발팀');  // 기본값으로 '개발팀' 설정
            
            setTaskToEdit(task);
            setTaskTitle(task.title || '');
            setTaskContent(task.content || '');
            setSelectedMembers(task.assignees ? task.assignees.map(a => a.name) : []);
            setTaskDeadline(task.dueDate || new Date().toISOString().split('T')[0]);
            setImportance(task.priority ? task.priority.toLowerCase() : 'middle');
            setTaskStatus(task.status ? task.status.toLowerCase() : 'not_started');
            setEditTaskModal(true);

            console.log('Edit modal opened with data:', {
                task,
                selectedMembers: task.assignees ? task.assignees.map(a => a.name) : [],
                teamMembers
            });
        } catch (error) {
            console.error('Failed to prepare edit modal:', error);
        }
    } else if (action === 'delete') {
        setTaskToDeleteId(taskId);
        setFinalRemoveCheckModal(true);
    }
  };

  // editTaskModal이 열릴 때마다 선택된 팀의 멤버 목록을 갱신
  useEffect(() => {
    if (editTaskModal && selectedTeam) {
        fetchTeamMembers(selectedTeam);
    }
  }, [editTaskModal, selectedTeam]);

  // handleUpdateTask 함수 수정
  const handleUpdateTask = async () => {
    if (!taskTitle.trim() || !taskContent.trim() || selectedMembers.length === 0) {
      setWarningModal(true);
      return;
    }

    try {
        if (!taskToEdit) return;

        // 업데이트 전에 먼저 전체 멤버 목록을 가져옴
        const response = await fetch(`/api/projects/${projectId}/members/all`, {
            headers: getHeaders(),
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('멤버 목록을 가져오는데 실패했습니다.');
        }

        // 가져온 멤버 목록에서 선택된 멤버들의 ID 찾기
        const assigneeIds = selectedMembers.map(memberName => {
            const member = data.members.find(m => m.name === memberName);
            console.log('매칭 시도:', { 
                찾는이름: memberName, 
                찾은멤버: member,
                매칭성공: member ? 'Yes' : 'No'
            });
            // member.id를 사용 (찾은 멤버 객체에서 id 필드가 있음)
            return member ? member.id : null;
        }).filter(id => id !== null);

        console.log('최종 선택된 담당자 IDs:', assigneeIds);

        const updateData = {
            project_id: parseInt(projectId),
            title: taskTitle,
            content: taskContent,
            status: taskStatus.toUpperCase(),
            priority: importance.toUpperCase(),
            dueDate: taskDeadline,
            assignees: assigneeIds
        };

        console.log('업무 수정 요청:', {
            taskId: taskToEdit.task_id,
            updateData
        });

        const updateResponse = await fetch(`/api/tasks/${taskToEdit.task_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        const updateDataResponse = await updateResponse.json();
        
        if (response.ok && data.success) {
            const projectTitle = await fetchProjectTitle(taskToEdit.project_id);
            const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${taskTitle}" 업무를 수정했습니다.`;
            await fetch('/api/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                project_id: taskToEdit.project_id,
                user_id: user.user_id,
                content: logContent
              })
            });
            
            await fetchTasks();
            setEditTaskModal(false);
            setTaskToEdit(null);
            resetForm();
        } else {
            throw new Error(data.message || '업무 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('업무 수정 실패:', error);
        alert(error.message || '업무 수정 중 오류가 발생했습니다.');
    }
  };

  // 삭제 확인 핸들러만 수정
  const handleConfirmDelete = async () => {
    if (!taskToDeleteId) return;

    // todoList에서 task 정보 가져오기
    const task = todoList.find(t => t.task_id === taskToDeleteId);
    if (!task) return;

    const deletedTask = {
      project_id: task.project_id,
      title: task.title
    };

    try {
      const response = await fetch(`/api/tasks/${taskToDeleteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '업무 삭제에 실패했습니다.');
      }

      setTodoList(prev => prev.filter(task => task.task_id !== taskToDeleteId));
      setFinalRemoveCheckModal(false);
      setTaskToDeleteId(null);
      setTaskToView(null);

      const projectTitle = await fetchProjectTitle(deletedTask.project_id);
      const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${deletedTask.title}" 업무를 삭제했습니다.`;

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: deletedTask.project_id,
          user_id: user.user_id,
          content: logContent
        })
      });

    } catch (error) {
      console.error('업무 삭제 실패:', error);
      alert(error.message || '업무 삭제 중 오류가 발생했습니다.');
    }
  };

  const getNextId = () => {
    if (todoList.length === 0) return 1;
    return Math.max(...todoList.map(t => t.id)) + 1;
  };

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    const date = new Date(timestamp);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  const handleViewTask = (task) => {
    setTaskToView(task);
    setViewTaskModal(true);
  };

  // 상태 변경을 위한 메뉴 아이템 정의 (컴포넌트 최상단에 추가)
  const statusMenuItems = [
    {
      key: 'not_started',
      label: '진행 전'
    },
    {
      key: 'in_progress',
      label: '진행 중'
    },
    {
      key: 'completed',
      label: '완료'
    }
  ];

  // 댓글 조회 함수
  const fetchComments = async (taskId) => {
    try {
      console.log('[댓글 조회] 시작 ====');
      console.log('[댓글 조회] Task ID:', taskId);

      const response = await fetch(`/api/comments/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('[댓글 조회] 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error('댓글 조회에 실패했습니다.');
      }

      const data = await response.json();
      console.log('[댓글 조회] 응답 데이터:', data);

      // todoList에서 현재 task를 찾아 댓글 업데이트
      const updatedList = todoList.map(task => {
        if (task.task_id === taskId) {
          return {
            ...task,
            comments: data
          };
        }
        return task;
      });

      setTodoList(updatedList);
      
      // 현재 보고 있는 task의 댓글도 업데이트
      if (taskToView && taskToView.task_id === taskId) {
        setTaskToView(prev => ({
          ...prev,
          comments: data
        }));
      }

      console.log('[댓글 조회] 완료 ====');
    } catch (error) {
      console.error('[댓글 조회] 오류 발생:', error);
    }
  };

  // taskToView가 변경될 때마다 댓글 조회
  useEffect(() => {
    if (taskToView && taskToView.task_id) {
      fetchComments(taskToView.task_id);
    }
  }, [taskToView?.task_id]);

  // [#] 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (!user) throw new Error('로그인이 필요합니다.');
      if (!user.user_id) throw new Error('사용자 ID를 찾을 수 없습니다.');

      // 1. 댓글 작성 요청
      const commentData = {
        task_id: taskToView.task_id,
        content: newComment.trim(),
        created_by: user.user_id
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(commentData)
      });

      if (!response.ok) throw new Error('댓글 생성에 실패했습니다.');

      const newCommentData = await response.json();

      // 2. 로그 저장 요청
      const projectTitle = await fetchProjectTitle(taskToView.project_id);

      const logContent = `${user.username} 님이 [${projectTitle}] 프로젝트의 "${taskToView.title}" 업무에 댓글을 남겼습니다.`;

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: taskToView.project_id,
          user_id: user.user_id,
          content: logContent
        })
      });

      // 3. created_by_name이 없는 상태이므로 수동 삽입
      const newCommentObj = {
        id: newCommentData.comment_id,
        created_by_name: user.username,
        created_at: newCommentData.created_at || new Date().toISOString(),
        content: newCommentData.content
      };

      const updatedList = todoList.map((task) => {
        if (task.task_id === taskToView.task_id) {
          return {
            ...task,
            comments: [...(task.comments || []), newCommentObj]
          };
        }
        return task;
      });

      // 4. 상태 업데이트
      setTodoList(updatedList);
      setTaskToView(updatedList.find((t) => t.task_id === taskToView.task_id));
      setNewComment('');
    } catch (error) {
      console.error('[댓글 작성 오류]', error);
      alert(error.message || '댓글 작성 중 오류가 발생했습니다.');
    }
  };

  return (
    <main>
      <Header>
        <div className='title'>TO-DO-LIST</div>
        <div className='btnWrapper'>
          <button onClick={() => { setAddTaskModal(true) }}><PlusOutlined /></button>
        </div>
      </Header>
      <CardList style={{ maxHeight: '600px', overflow: 'hidden', overflowY: 'auto'}}>
        {todoList.map((a) => (
          <Card key={a.task_id} styles={{ body: { display: 'flex', flexDirection: 'row', height: '100%', padding: 0 } }}>
            <header>
              <div className='title' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px',
                    fontWeight: 'bold'
                  }}
                >
                  {a.title}
                </span>
                <button
                  onClick={() => handleStatusChange(a.task_id, getNextStatus(a.status))}
                  style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor:
                      a.status.toUpperCase() === 'COMPLETED' ? '#d1f0d1' :
                      a.status.toUpperCase() === 'IN_PROGRESS' ? '#fff3cd' :
                      '#e0e0e0',
                    color:
                      a.status.toUpperCase() === 'COMPLETED' ? '#2e7d32' :
                      a.status.toUpperCase() === 'IN_PROGRESS' ? '#856404' :
                      '#555',
                    marginLeft: '8px',
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    minWidth: '60px',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '24px',
                    lineHeight: '1',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getStatusDisplay(a.status)}
                </button>
              </div>
              <div className='btnWrapper'>
                <Dropdown
                  menu={{
                    items: actionMenuItems(a.task_id)  // task_id 사용
                  }}
                  trigger={['click']}
                >
                  <button><EllipsisOutlined /></button>
                </Dropdown>
              </div>
            </header>
            <article>
              <span className='members' style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px', verticalAlign: 'bottom' }}>
                담당인원:&nbsp;
                {(a.assignees || a.assignee_details || []).length > 0 
                    ? (a.assignees || a.assignee_details).map((assignee, index) => (
                        <React.Fragment key={index}>
                            {assignee.name || assignee.username || assignee}
                            {index < (a.assignees || a.assignee_details).length - 1 ? ', ' : ''}
                        </React.Fragment>
                    )) 
                    : '미지정'}
              </span>
              <span className='dueDate'>마감일: {a.dueDate}</span>
            </article>
            <span className='more' onClick={() => {setTaskToView(a); setViewTaskModal(true);}}>
              더보기
              <ArrowRightOutlined />
            </span>
          </Card>
        ))}
      </CardList>

      {/* Task Modal */}
      {addTaskModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h2>업무사항 추가</h2> <hr />
            <label htmlFor="task_title">제목: </label> <br />
            <input 
              type="text" 
              name="task_title" 
              id="task_title" 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            /> <br />

            <label htmlFor="task_content">내용: </label> <br />
            <textarea 
              id="task_content" 
              className={modalStyles.textareaInput} 
              value={taskContent} 
              onChange={(e) => setTaskContent(e.target.value)}
            ></textarea> <br />

            <label>
              담당인원 목록 (드래그 가능):
              <select
                className={dragStyles.selectedMemberGroups}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="개발팀">개발팀</option>
                <option value="디자인팀">디자인팀</option>
                <option value="기획팀">기획팀</option>
              </select>
            </label>
            <div className={dragStyles.dragListContainer}>
              {teamMembers.length > 0 ? (
                teamMembers.map((member, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", member.name)}
                    className={dragStyles.draggableItem}
                  >
                    {member.name}
                  </div>
                ))
              ) : (
                <div className={dragStyles.noMembers}>
                  해당 팀의 프로젝트 멤버가 없습니다.
                </div>
              )}
            </div>

            <label htmlFor="task_members">담당인원: </label> <br />
            <div 
              className={`${dragStyles.dropArea} ${selectedMembers.length === 0 ? dragStyles.dropAreaEmpty : ''}`}
              onDrop={(e) => { 
                e.preventDefault();
                const name = e.dataTransfer.getData("text/plain");
                if (!selectedMembers.includes(name)) {
                  setSelectedMembers([...selectedMembers, name]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              /*
                [사용된 속성과 on함수 설명]
                0|  onDragOver: 드래그 중인 요소가 이 영역 위에 올라왔을 때 동작 → e.preventDefault() 해야 drop 가능함
                1|  onDrop: 실제로 드롭될 때 동작
                2|  e.dataTransfer.getData(...) 로 드래그된 이름 가져옴
                3|  selectedMembers 상태에 중복 없이 추가
              */
            >
              {selectedMembers.length === 0 ? (
                <span className={dragStyles.dropPlaceholder}>이름을 여기에 드롭하세요.</span>
              ) : (
                selectedMembers.map((member, index) => (
                  <span key={index} className={dragStyles.selectedMember}>
                    {member}
                    <button 
                      className={dragStyles.removeButton} 
                      onClick={() => {
                        setSelectedMembers(selectedMembers.filter((m) => m !== member));
                      }}
                    > x
                    </button>
                  </span>
                ))
              )}
            </div>

            <fieldset className={modalStyles.task_importance}>
              <legend>업무 중요도:</legend>
              <div className={modalStyles.radioGroup}>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="high" 
                    checked={importance === 'high'} 
                    onChange={() => setImportance('high')} 
                  /> 
                  <span>높음</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="middle" 
                    checked={importance === 'middle'} 
                    onChange={() => setImportance('middle')} 
                  /> 
                  <span>보통</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="low" 
                    checked={importance === 'low'} 
                    onChange={() => setImportance('low')} 
                  />
                  <span>낮음</span>
                </label>
              </div>
            </fieldset> <br />

            <label htmlFor="task_deadline">마감일: </label> <br />
            <input 
              type="date" 
              className={modalStyles.task_deadline} 
              name="task_deadline" 
              id="task_deadline" 
              value={taskDeadline} 
              onChange={(e) => setTaskDeadline(e.target.value)}
            /> <br/>

            <div className={modalStyles.modalButtonWrapper}>
              <button 
                id={modalStyles.confirmButton} 
                onClick={handleAddTask}
              >
                작성 완료
              </button>
              <button 
                id={modalStyles.cancelButton} 
                onClick={() => {
                  setAddTaskModal(false); 
                  resetForm();
                }}
              >닫기</button>
            </div>
          </div>
        </div>
      )}

      {/*업무 삭제하기 누를 때 최종 확인을 위한 모달창*/}
      {finalRemoveCheckModal && (
        <div className={finalCheckModalStyles.finalCheckModalOverlay}>
          <div className={finalCheckModalStyles.finalCheckModalContent}>
            <h2>업무 삭제</h2> <hr />

            <div className={finalCheckModalStyles.main_text}>
              <h4>삭제하면 다시 복구할 수 없습니다.</h4>
              <h4>이 업무를 정말 삭제하겠습니까?</h4>
            </div>

            <div className={finalCheckModalStyles.modalButtonWrapper}>
              <button 
                id={finalCheckModalStyles.confirmButton} 
                onClick={handleConfirmDelete}
              >
                확인
              </button>
              <button 
                id={finalCheckModalStyles.cancelButton} 
                onClick={() => {
                  setFinalRemoveCheckModal(false);
                  setTaskToDeleteId(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/*수정하기를 눌렀을 때 떠야하는 모달창*/}
      {editTaskModal && taskToEdit && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h2>업무사항 수정</h2> <hr />
            <label htmlFor="task_title">제목: </label> <br />
            <input 
              type="text" 
              name="task_title" 
              id="task_title" 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            /> <br />

            <label htmlFor="task_content">내용: </label> <br />
            <textarea 
              id="task_content" 
              className={modalStyles.textareaInput} 
              value={taskContent} 
              onChange={(e) => setTaskContent(e.target.value)}
            ></textarea> <br />

            <label>
              담당인원 목록 (드래그 가능):
              <select
                className={dragStyles.selectedMemberGroups}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="개발팀">개발팀</option>
                <option value="디자인팀">디자인팀</option>
                <option value="기획팀">기획팀</option>
              </select>
            </label>
            <div className={dragStyles.dragListContainer}>
              {teamMembers.length > 0 ? (
                teamMembers.map((member, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", member.name)}
                    className={dragStyles.draggableItem}
                  >
                    {member.name}
                  </div>
                ))
              ) : (
                <div className={dragStyles.noMembers}>
                  해당 팀의 프로젝트 멤버가 없습니다.
                </div>
              )}
            </div>

            <label htmlFor="task_members">담당인원: </label> <br />
            <div 
              className={`${dragStyles.dropArea} ${selectedMembers.length === 0 ? dragStyles.dropAreaEmpty : ''}`}
              onDrop={(e) => { 
                e.preventDefault();
                const name = e.dataTransfer.getData("text/plain");
                if (!selectedMembers.includes(name)) {
                  setSelectedMembers([...selectedMembers, name]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
                /*
                    [사용된 속성과 on함수 설명]
                    0|  onDragOver: 드래그 중인 요소가 이 영역 위에 올라왔을 때 동작 → e.preventDefault() 해야 drop 가능함
                    1|  onDrop: 실제로 드롭될 때 동작
                    2|  e.dataTransfer.getData(...) 로 드래그된 이름 가져옴
                    3|  selectedTeam 상태에 중복 없이 추가
                  */
            >
              {selectedMembers.length === 0 ? (
                <span className={dragStyles.dropPlaceholder}>이름을 여기에 드롭하세요.</span>
              ) : (
                selectedMembers.map((member, index) => (
                  <span key={index} className={dragStyles.selectedMember}>
                    {member}
                    <button 
                      className={dragStyles.removeButton} 
                      onClick={() => {
                        setSelectedMembers(selectedMembers.filter((m) => m !== member));
                      }}
                    > x
                    </button>
                  </span>
                ))
              )}
            </div>

            <fieldset className={modalStyles.task_importance}>
              <legend>업무 중요도:</legend>
              <div className={modalStyles.radioGroup}>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="high" 
                    checked={importance === 'high'} 
                    onChange={() => setImportance('high')} 
                  /> 
                  <span>높음</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="middle" 
                    checked={importance === 'middle'} 
                    onChange={() => setImportance('middle')} 
                  /> 
                  <span>보통</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="priority" 
                    value="low" 
                    checked={importance === 'low'} 
                    onChange={() => setImportance('low')} 
                  />
                  <span>낮음</span>
                </label>
              </div>
            </fieldset> <br />

            <label htmlFor="task_deadline">마감일: </label> <br />
            <input 
              type="date" 
              className={modalStyles.task_deadline} 
              name="task_deadline" 
              id="task_deadline" 
              value={taskDeadline} 
              onChange={(e) => setTaskDeadline(e.target.value)}
            /> <br/>

            <div className={modalStyles.modalButtonWrapper}>
              <button 
                id={modalStyles.confirmButton} 
                onClick={handleUpdateTask}
              >수정 완료</button>
              <button 
                id={modalStyles.cancelButton} 
                onClick={() => {
                  setEditTaskModal(false);
                  setTaskToEdit(null);
                  resetForm();
                }}
              >닫기</button>
            </div>
          </div>
        </div>
      )}

      {/*더보기 모달*/}
      {viewTaskModal && taskToView && (
        <div className={styles.viewModalOverlay}>
          <div className={styles.viewModalContent}>
            {/* 왼쪽: 업무 정보 */}
            <div className={styles.leftSection}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                gap: '12px'
              }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>
                  {taskToView.title}
                </h2>

                <button
                  onClick={() => handleStatusChange(taskToView.task_id, getNextStatus(taskToView.status))}
                  style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor:
                      taskToView.status.toUpperCase() === 'COMPLETED' ? '#d1f0d1' :
                      taskToView.status.toUpperCase() === 'IN_PROGRESS' ? '#fff3cd' :
                      '#e0e0e0',
                    color:
                      taskToView.status.toUpperCase() === 'COMPLETED' ? '#2e7d32' :
                      taskToView.status.toUpperCase() === 'IN_PROGRESS' ? '#856404' :
                      '#555',
                    marginLeft: '8px',
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    minWidth: '60px',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '24px',
                    lineHeight: '1',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getStatusDisplay(taskToView.status)}
                </button>
              </div>

              <div className={styles.metaInfo}>
                <p><strong>작성일:</strong> {taskToView.created_at ? new Date(taskToView.created_at).toLocaleDateString('ko-KR') : '-'}</p>
                <p><strong>수정일:</strong> {taskToView.updated_at ? new Date(taskToView.updated_at).toLocaleDateString('ko-KR') : '-'}</p>
                <p><strong>조회수:</strong> {taskToView.views || 0}</p>
              </div>

              <hr/>

              <p className={styles.label}>내용:</p>
              <div className={styles.contentScrollBox}>
                {taskToView.content || '내용이 없습니다.'}
              </div>

              <p className={styles.label}>담당인원:</p>
              <div className={styles.contentScrollBox}>
                {taskToView.assignees && taskToView.assignees.length > 0 
                  ? taskToView.assignees.map(assignee => assignee.name).join(', ')
                  : '담당자가 지정되지 않았습니다.'}
              </div>

              <div className={styles.taskInfoGroup}>
                <p>
                  <span className={styles.label}>마감일:</span> {taskToView.dueDate || '-'}
                </p>
                <p>
                  <span className={styles.label}>중요도:</span> {
                    taskToView.priority === 'HIGH' ? '높음' :
                    taskToView.priority === 'MEDIUM' ? '보통' :
                    taskToView.priority === 'LOW' ? '낮음' :
                    taskToView.priority || '미설정'
                  }
                </p>
                <p>
                  <span className={styles.label}>상태:</span> {
                    taskToView.status === 'NOT_STARTED' || taskToView.status === 'not_started' ? '진행 전' :
                    taskToView.status === 'IN_PROGRESS' || taskToView.status === 'in_progress' ? '진행 중' :
                    taskToView.status === 'COMPLETED' || taskToView.status === 'completed' ? '완료' :
                    '알 수 없음'
                  }
                </p>
              </div>

              <div className={styles.modalButtonWrapper}>
                <button
                  id={styles.editButton}
                  onClick={() => {
                    setTaskToEdit(taskToView);
                    setTaskTitle(taskToView.title);
                    setTaskContent(taskToView.content);
                    setSelectedMembers(taskToView.assignees ? taskToView.assignees.map(a => a.name) : []);
                    setTaskDeadline(taskToView.dueDate);
                    setImportance(taskToView.priority ? taskToView.priority.toLowerCase() : 'middle');
                    setTaskStatus(taskToView.status ? taskToView.status.toLowerCase() : 'not_started');
                    setEditTaskModal(true);
                    setViewTaskModal(false);
                  }}
                >
                  수정하기
                </button>
                <button
                  id={styles.closeButton}
                  onClick={() => {
                    setViewTaskModal(false);
                    setTaskToView(null);
                  }}
                >
                  닫기
                </button>
              </div>
            </div>

            {/* 오른쪽: 댓글 영역 */}
            <div className={styles.rightSection}>
              <h3>Comment ({taskToView.comments?.length || 0})</h3>

              <ul className={styles.commentList}>
                {(taskToView.comments || []).map((comment, idx) => (
                  <li key={comment.id || idx} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentUser}>
                        {comment.created_by_name || '알 수 없는 사용자'}
                      </span>
                      <span className={styles.commentTime}>
                        {comment.created_at 
                          ? formatRelativeTime(new Date(comment.created_at).getTime())
                          : comment.time || '방금 전'
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
                <button onClick={handleSubmitComment}>작성</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>{renderTrigger}</div>

      {warningModal && (
          <div className={warningModalStyles.finalCheckModalOverlay}>
            <div className={warningModalStyles.finalCheckModalContent}>
              <h2>경고!</h2> <hr />
  
              <div className={warningModalStyles.main_text}>
                <h4>제목, 내용은 입력해주시고,</h4>
                <h4>담당 인원은 드래그로 채워주세요</h4>
              </div>
  
              <div className={warningModalStyles.modalButtonWrapper}>
                <button id={warningModalStyles.confirmButton} onClick={() => {setWarningModal(false);}}>확인</button>
              </div>
            </div>
          </div>
        )}
    </main>
  )
}

export default TodoList