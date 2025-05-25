import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { PlusOutlined, EllipsisOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Dropdown, Menu } from 'antd'
import modalStyles from './css_folder/Task.module.css'
import finalCheckModalStyles from './css_folder/finalCheckModal.module.css'
import dragStyles from './css_folder/DragDropStyles.module.css'
import styles from './css_folder/ViewModal.module.css'
import { Header, CardList, Card } from './css_folder/TodoList.styles';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';


const TodoList = ({ members: allMembers = [], teamMap }) => {
  const { projectId } = useParams();
  const [todoList, setTodoList] = useState([]);
  
  // API 호출을 위한 기본 설정
  const getHeaders = () => ({
    'Authorization': `Bearer ${Cookies.get('token')}`,
    'Content-Type': 'application/json'
  });

  // 업무 목록 조회 함수
  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setTodoList(data.tasks);
      } else {
        throw new Error(data.message || '업무 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('업무 목록 조회 실패:', error);
      // 에러 처리 (예: 알림 표시)
    }
  };

  // 컴포넌트 마운트 시 업무 목록 조회
  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // 업무 추가 모달
  const [addTaskModal, setAddTaskModal] = useState(false);

  // 담당인원 관련 상태
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('개발팀');
  const [devNames, setDevNames] = useState([]);
  const [designNames, setDesignNames] = useState([]);
  const [planNames, setPlanNames] = useState([]);

  useEffect(() => {
    if (teamMap) {
      setDevNames(teamMap['개발팀'] || []);
      setDesignNames(teamMap['디자인팀'] || []);
      setPlanNames(teamMap['기획팀'] || []);
    }
  }, [teamMap]);

  const memberGroups = {
    개발팀: (allMembers || []).filter((name) => devNames.includes(name)),
    디자인팀: (allMembers || []).filter((name) => designNames.includes(name)),
    기획팀: (allMembers || []).filter((name) => planNames.includes(name))
  };
  const members = memberGroups[selectedTeam];

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

  // 시간 표시 리렌더링용
  const [renderTrigger, setRenderTrigger] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (key, id) => {
    const index = todoList.findIndex((t) => t.id === id);
    if (index === -1) return;

    if (key === 'edit') {
      const task = todoList[index];
      setTaskToEdit(task);
      setTaskTitle(task.title);
      setTaskContent(task.content);
      setSelectedMembers(task.members);
      setTaskDeadline(task.dueDate);
      setImportance(task.importance);
      setTaskWriter(task.writer || '');
      setTaskStatus(task.status || 'not_started');
      setEditTaskModal(true);
    } else if (key === 'delete') {
      setTaskToDeleteId(id);
      setFinalRemoveCheckModal(true);
    }
  };

  const handleUpdateTask = async () => {
    try {
      const updateData = {
        title: taskTitle,
        content: taskContent,
        priority: importance,
        status: taskStatus,
        dueDate: taskDeadline,
        assignees: selectedMembers.map(memberName => {
          const member = allMembers.find(m => m.name === memberName);
          return member ? member.user_id : null;
        }).filter(id => id !== null)
      };

      const response = await fetch(`/api/tasks/${taskToEdit.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTasks(); // 목록 새로고침
        setEditTaskModal(false);
        setTaskToEdit(null);
        resetForm();
      } else {
        throw new Error(data.message || '업무 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('업무 수정 실패:', error);
    }
  };

  const getNextId = () => {
    if (todoList.length === 0) return 1;
    return Math.max(...todoList.map(t => t.id)) + 1;
  };

  const handleAddTask = async () => {
    try {
      // API 요청 데이터 구성
      const taskData = {
        project_id: parseInt(projectId),
        title: taskTitle,
        content: taskContent,
        priority: importance,
        status: 'not_started',
        dueDate: taskDeadline,
        assignees: selectedMembers.map(memberName => {
          const member = allMembers.find(m => m.name === memberName);
          return member ? member.user_id : null;
        }).filter(id => id !== null)
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTasks(); // 목록 새로고침
        setAddTaskModal(false);
        resetForm();
      } else {
        throw new Error(data.message || '업무 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('업무 생성 실패:', error);
      // 에러 처리 (예: 알림 표시)
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskContent('');
    setSelectedMembers([]);
    setSelectedTeam('개발팀');
    setTaskDeadline(new Date().toISOString().split('T')[0]);
    setImportance('middle');
    setTaskStatus('not_started');
  };

  const handleConfirmDelete = async () => {
    if (taskToDeleteId) {
      try {
        const response = await fetch(`/api/tasks/${taskToDeleteId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });

        const data = await response.json();
        if (response.ok && data.success) {
          await fetchTasks(); // 목록 새로고침
          setFinalRemoveCheckModal(false);
          setTaskToDeleteId(null);
        } else {
          throw new Error(data.message || '업무 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('업무 삭제 실패:', error);
      }
    }
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

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="edit">수정하기</Menu.Item>
      <Menu.Item key="delete">삭제하기</Menu.Item>
    </Menu>
  );

  return (
    <main>
      <Header>
        <div className='title'>TO-DO-LIST</div>
        <div className='btnWrapper'>
          <button onClick={() => { setAddTaskModal(true) }}><PlusOutlined /></button>
        </div>
      </Header>
      <CardList style={{ maxHeight: '600px', overflow: 'hidden', overflowY: 'auto'}}>
        {todoList.map((task) => (
          <Card key={task.task_id}>
            <header>
              <div className='title' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px',
                  fontWeight: 'bold'
                }}>
                  {task.title}
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor:
                    task.status === 'completed' ? '#d1f0d1' :
                    task.status === 'in_progress' ? '#fff3cd' :
                    '#e0e0e0',
                  color:
                    task.status === 'completed' ? '#2e7d32' :
                    task.status === 'in_progress' ? '#856404' :
                    '#555',
                  marginLeft: '8px',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const newStatus = task.status === 'not_started' ? 'in_progress' :
                                  task.status === 'in_progress' ? 'completed' :
                                  'not_started';
                  handleStatusChange(task.task_id, newStatus);
                }}>
                  {task.status === 'completed' ? '완료' :
                   task.status === 'in_progress' ? '진행 중' :
                   '진행 전'}
                </span>
              </div>
              <div className='btnWrapper'>
                <Dropdown
                  menu={
                    <Menu onClick={({ key }) => handleMenuClick(key, task.task_id)}>
                      <Menu.Item key="edit">수정하기</Menu.Item>
                      <Menu.Item key="delete">삭제하기</Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <button><EllipsisOutlined /></button>
                </Dropdown>
              </div>
            </header>
            <article>
              <span className='members' style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px', verticalAlign: 'bottom' }}>
                담당인원:&nbsp;
                {task.assignees && task.assignees.map((assignee, index) => (
                  <React.Fragment key={index}>
                    {assignee.name}
                    {index < task.assignees.length - 1 ? ', ' : ''}
                  </React.Fragment>
                ))}
              </span>
              <span className='dueDate'>마감일: {task.dueDate}</span>
            </article>
          </Card>
        ))}
      </CardList>

      {/* Task Modal */}
      {addTaskModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h2>업무사항 추가</h2> <hr />
            <label htmlFor="task_title">제목: </label> <br />
            <input type="text" name="task_title" id="task_title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}/> <br />

            <label htmlFor="task_content">내용: </label> <br />
            <textarea id="task_content" className={modalStyles.textareaInput} value={taskContent} onChange={(e) => setTaskContent(e.target.value)}></textarea> <br />

            <label>
              담당인원 목록 (드래그 가능):
              <select
                className={dragStyles.selectedMemberGroups}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {Object.keys(memberGroups).map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </label>
            <div className={dragStyles.dragListContainer}>
              {members.map((name, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", name)}
                  className={dragStyles.draggableItem}
                >
                  {name}
                </div>
              ))}
            </div>

            <label htmlFor="task_members">담당인원: </label> <br />
            <div className={`${dragStyles.dropArea} ${selectedMembers.length === 0 ? dragStyles.dropAreaEmpty : ''}`}
                 onDrop={(e) => { 
                    e.preventDefault();
                    const name = e.dataTransfer.getData("text/plain");
                    if (!selectedMembers.includes(name)) {setSelectedMembers([...selectedMembers, name]);}
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
                      <button className={dragStyles.removeButton} 
                              onClick={() => {setSelectedMembers(selectedMembers.filter((m) => m !== member));}}
                      > x
                      </button>
                    </span>
                  ))
                )}
            </div> <br />

            <fieldset className={modalStyles.task_importance}>
              <legend>업무 중요도:</legend>
              <div className={modalStyles.radioGroup}>
                <label>
                  <input type="radio" name="importance" value="high" checked={importance === 'high'} onChange={() => setImportance('high')} /> 
                  <span>높음</span>
                </label>
                <label>
                  <input type="radio" name="importance" value="middle" checked={importance === 'middle'} onChange={() => setImportance('middle')} /> 
                  <span>보통</span>
                </label>
                <label>
                  <input type="radio" name="importance" value="low" checked={importance === 'low'} onChange={() => setImportance('low')} />
                  <span>낮음</span>
                </label>
              </div>
            </fieldset> <br />

            <label htmlFor="task_deadline">마감일: </label> <br />
            <input type="date" className={modalStyles.task_deadline} name="task_deadline" id="task_deadline" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)}/> <br/>

            <label htmlFor="notice_writer">작성자: </label> <br />
            <input type="text" name="notice_writer" id="notice_writer" /> <br />

            <div className={modalStyles.modalButtonWrapper}>
              <button id={modalStyles.confirmButton} onClick={handleAddTask}>작성 완료</button>
              <button id={modalStyles.cancelButton} onClick={() => {setAddTaskModal(false); setSelectedMembers(''); setSelectedTeam('개발팀'); setTaskDeadline(today);}}>닫기</button>
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
              <button id={finalCheckModalStyles.confirmButton} onClick={handleConfirmDelete}>확인</button>
              <button id={finalCheckModalStyles.cancelButton} onClick={() => {setFinalRemoveCheckModal(false)}}>취소</button>
            </div>
          </div>
        </div>
      )}

      
      {/*수정하기를 눌렀을 때 떠야하는 모달창*/}
      {editTaskModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h2>업무사항 수정</h2> <hr />
            <label htmlFor="task_title">제목: </label> <br />
            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /> <br />

            <label htmlFor="task_content">내용: </label> <br />
            <textarea value={taskContent} onChange={(e) => setTaskContent(e.target.value)}></textarea> <br />

            <label>
              담당인원 목록 (드래그 가능):
              <select
                className={dragStyles.selectedMemberGroups}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {Object.keys(memberGroups).map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </label>
            <div className={dragStyles.dragListContainer}>
              {members.map((name, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", name)}
                  className={dragStyles.draggableItem}
                >
                  {name}
                </div>
              ))}
            </div>

            <label htmlFor="task_members">담당인원: </label> <br />
            <div className={`${dragStyles.dropArea} ${selectedMembers.length === 0 ? dragStyles.dropAreaEmpty : ''}`}
                 onDrop={(e) => { 
                    e.preventDefault();
                    const name = e.dataTransfer.getData("text/plain");
                    if (!selectedMembers.includes(name)) {setSelectedMembers([...selectedMembers, name]);}
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
                      <button className={dragStyles.removeButton} 
                              onClick={() => {setSelectedMembers(selectedMembers.filter((m) => m !== member));}}
                      > x
                      </button>
                    </span>
                  ))
                )}
            </div> <br />

            <fieldset className={modalStyles.task_importance}>
              <legend>업무 중요도:</legend>
              <div className={modalStyles.radioGroup}>
                <label>
                  <input type="radio" value="high" checked={importance === 'high'} onChange={() => setImportance('high')} />
                  <span>높음</span>
                </label>
                <label>
                  <input type="radio" value="middle" checked={importance === 'middle'} onChange={() => setImportance('middle')} />
                  <span>보통</span>
                </label>
                <label>
                  <input type="radio" value="low" checked={importance === 'low'} onChange={() => setImportance('low')} />
                  <span>낮음</span>
                </label>
              </div>
            </fieldset> <br />

            <label htmlFor="task_deadline">마감일: </label> <br />
            <input type="date" className={modalStyles.task_deadline} name="task_deadline" id="task_deadline" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)}/> <br/>

            <label htmlFor="notice_writer">작성자: </label> <br />
            <input type="text" name="notice_writer" id="notice_writer" value={taskWriter} readOnly/> <br />

            <div className={modalStyles.modalButtonWrapper}>
              <button id={modalStyles.confirmButton} onClick={handleUpdateTask}>수정 완료</button>
              <button id={modalStyles.cancelButton} onClick={() => { setEditTaskModal(false); resetForm(); }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/*더보기도...*/}
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

                <Dropdown
                  menu={
                    <Menu onClick={({ key }) => {
                      const updatedList = todoList.map(task =>
                        task.id === taskToView.id ? { ...task, status: key } : task
                      );
                      setTodoList(updatedList);
                      setTaskToView(updatedList.find(t => t.id === taskToView.id));
                    }}>
                      <Menu.Item key="not_started">진행 전</Menu.Item>
                      <Menu.Item key="in_progress">진행 중</Menu.Item>
                      <Menu.Item key="completed">완료</Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <button style={{
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    minWidth: '80px'
                  }}>
                    {taskToView.status === 'not_started'
                      ? '진행 전'
                      : taskToView.status === 'in_progress'
                      ? '진행 중'
                      : '완료'}
                  </button>
                </Dropdown>
              </div>

              <div className={styles.metaInfo}>
                <p><strong>작성자:</strong> {taskToView.writer || 'User_1'}</p>
                <p><strong>작성일:</strong> {taskToView.createdAt || '2025-03-21'}</p>
                <p><strong>수정일:</strong> {taskToView.updatedAt || '-'}</p>
                <p><strong>조회수:</strong> {taskToView.views || 2}</p>
              </div>

              <hr/>

              <p className={styles.label}>내용:</p>
              <div className={styles.contentScrollBox}>
                {taskToView.content}
              </div>

              <p className={styles.label}>담당인원:</p>
              <div className={styles.contentScrollBox}>
                {taskToView.members && taskToView.members.join(', ')}
              </div>

              <div className={styles.taskInfoGroup}>
                <p>
                  <span className={styles.label}>마감일:</span> {taskToView.dueDate}
                </p>
                <p>
                  <span className={styles.label}>중요도:</span> {taskToView.importance}
                </p>
              </div>

              <div className={styles.modalButtonWrapper}>
                <button
                  id={styles.editButton}
                  onClick={() => {
                    setTaskToEdit(taskToView);
                    setTaskTitle(taskToView.title);
                    setTaskContent(taskToView.content);
                    setSelectedMembers(taskToView.members);
                    setTaskDeadline(taskToView.dueDate);
                    setImportance(taskToView.importance);
                    setTaskWriter(taskToView.writer || '');
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
                    setTaskToView(null); // 이 줄을 반드시 추가!
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

                    const updatedList = todoList.map((task) => {
                      if (task.id === taskToView.id) {
                        const newCommentList = [
                          ...(task.comments || []),
                          {
                            user: 'User1',
                            timestamp: Date.now(),
                            text: newComment.trim(),
                          }
                        ];
                        return {
                          ...task,
                          comments: newCommentList,
                        };
                      }
                      return task;
                    });

                    setTodoList(updatedList);

                    const updatedTask = updatedList.find((t) => t.id === taskToView.id);
                    setTaskToView(updatedTask);

                    setNewComment('');
                  }}
                >
                  작성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>{renderTrigger}</div>
    </main>
  )
}

export default TodoList