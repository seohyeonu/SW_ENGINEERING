import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Checkbox, Avatar, List, App } from 'antd';
import InviteMemberModal from './InviteMemberModal';
import ChatModal from './ChatModal';
import styles from './css_folder/MembersFloatingButton.module.css';

export default function MembersFloatingButton({ projectId }) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [checkedList, setCheckedList] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // projectId가 유효하지 않으면 컴포넌트를 렌더링하지 않음
  if (!projectId) {
    console.warn('[MembersFloatingButton] projectId가 없습니다.');
    return null;
  }

  // 컴포넌트 마운트 시 로깅
  useEffect(() => {
    console.log('[MembersFloatingButton] 컴포넌트 마운트');
    console.log('[MembersFloatingButton] projectId:', {
      value: projectId,
      type: typeof projectId,
      truthiness: !!projectId
    });
  }, [projectId]);

  // 팀원 목록 조회 함수
  const fetchMembers = useCallback(async () => {
    try {
      console.log('[MembersFloatingButton] 팀원 목록 조회 시작');
      console.log('[MembersFloatingButton] projectId:', {
        value: projectId,
        type: typeof projectId,
        truthiness: !!projectId
      });
      
      if (!projectId) {
        console.error('[MembersFloatingButton] projectId가 없습니다.');
        return;
      }
      
      const url = `/api/projects/${projectId}/members/all`;
      console.log('[MembersFloatingButton] 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[MembersFloatingButton] 응답 상태:', response.status);
      console.log('[MembersFloatingButton] 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[MembersFloatingButton] 응답 에러:', errorData);
        throw new Error(errorData.message || '팀원 목록 조회 실패');
      }

      const data = await response.json();
      console.log('[MembersFloatingButton] 응답 데이터:', data);
      
      if (data.success) {
        console.log('[MembersFloatingButton] 팀원 목록 설정:', data.members);
        setMemberList(data.members);
      } else {
        console.error('[MembersFloatingButton] 팀원 목록 조회 실패:', data.message);
        message.error(data.message || '팀원 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('[MembersFloatingButton] 오류 발생:', error);
      message.error(error.message || '팀원 목록을 불러오는데 실패했습니다.');
    }
  }, [projectId, message]);

  // 컴포넌트 마운트 시와 프로젝트 ID 변경 시 팀원 목록 조회
  useEffect(() => {
    console.log('[MembersFloatingButton] projectId useEffect 실행:', projectId);
    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  // memberList 변경 시 로깅
  useEffect(() => {
    console.log('[MembersFloatingButton] memberList 업데이트:', memberList);
  }, [memberList]);

  const handleDelete = async () => {
    try {
      console.log('[MembersFloatingButton] 멤버 삭제 시작:', checkedList);
      
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          memberIds: checkedList
        })
      });

      const data = await response.json();
      console.log('[MembersFloatingButton] 삭제 응답:', data);

      if (data.success) {
        // 성공적으로 삭제된 경우 즉시 상태 업데이트
        setMemberList(prev => prev.filter(member => !checkedList.includes(member.id)));
        setCheckedList([]);
        setShowConfirm(false);
        setDeleteMode(false);
        message.success(data.message || '멤버가 성공적으로 삭제되었습니다.');
        
        // 백그라운드에서 목록 새로고침 (UI는 즉시 업데이트됨)
        setTimeout(() => {
          fetchMembers();
        }, 100);
      } else {
        message.error(data.message || '멤버 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('[MembersFloatingButton] 멤버 삭제 중 오류:', error);
      message.error('멤버 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!open) setShowConfirm(false);
  }, [open]);

  useEffect(() => {
    // 멤버 목록 갱신 이벤트 리스너 추가
    const handleRefreshMembers = () => {
      console.log('[MembersFloatingButton] refreshProjectMembers 이벤트 수신');
      // 중복 호출 방지를 위해 약간의 지연 후 실행
      setTimeout(() => {
        fetchMembers();
      }, 100);
    };

    window.addEventListener('refreshProjectMembers', handleRefreshMembers);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      console.log('[MembersFloatingButton] 이벤트 리스너 제거');
      window.removeEventListener('refreshProjectMembers', handleRefreshMembers);
    };
  }, [projectId, fetchMembers]);

  return (
    <>
      <Button
        type="default"
        icon={<span className={styles.iconBox}><i className="bx bx-group"></i></span>}
        className={styles.floatingButton}
        onMouseEnter={() => setOpen(true)}
      />

      <Modal
        open={open}
        onCancel={() => { setOpen(false); setDeleteMode(false); setCheckedList([]); }}
        footer={null}
        title={
          <div className={styles.modalHeader}>
            <span className={deleteMode ? styles.deleteModeTitle : styles.modalTitle}>
              {deleteMode ? 'Member Delete' : 'Members'}
            </span>
            <button className={styles.iconBtn} onClick={() => setInviteOpen(true)}>
              <i className="bx bx-user-plus"></i>
            </button>
            <button className={styles.iconBtn} onClick={() => { setDeleteMode(d => !d); setCheckedList([]); }}>
              <i className="bx bx-user-minus"></i>
            </button>
            {deleteMode && (
              <button
                className={styles.iconBtn}
                style={{ color: checkedList.length > 0 ? '#d64343' : '#ccc', fontSize: 12, marginLeft: 4 }}
                disabled={checkedList.length === 0}
                onClick={() => checkedList.length > 0 && setShowConfirm(true)}
              >
                <i className="bx bx-trash"></i>
              </button>
            )}
          </div>
        }
        width={330}
        style={{ top: '10%', left: 'calc(79%)', position: 'fixed' }}
        mask={false}
        closable={false}
        styles={{ body: { padding: 20, position: 'relative' } }}
        afterClose={() => { setOpen(false); setDeleteMode(false); setCheckedList([]); setShowConfirm(false); }}
        onMouseLeave={() => { setOpen(false); setDeleteMode(false); setCheckedList([]); setShowConfirm(false); }}
      >
        <div style={{ position: 'relative', maxHeight: '500px', overflowY: 'auto' }}>
          <List
            dataSource={memberList}
            locale={{ emptyText: '멤버가 없습니다.' }}
            renderItem={member => (
              <List.Item className={styles.listItem}>
                {deleteMode && (
                  <Checkbox
                    checked={checkedList.includes(member.id)}
                    onChange={e => {
                      setCheckedList(list =>
                        e.target.checked
                          ? [...list, member.id]
                          : list.filter(id => id !== member.id)
                      );
                    }}
                    style={{ marginRight: 8 }}
                  />
                )}
                <div className={styles.memberContainer}>
                  <Avatar size={36} style={{ background: '#659BFF', flexShrink: 0 }}>
                    {member.name[0]}
                  </Avatar>
                  <div className={styles.memberText}>
                    <div className={styles.memberInfoLine}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberTeam}>{member.fields}</span>
                    </div>
                    <div
                      className={styles.memberStatus}
                      style={{ color: member.status === 'online' ? '#4caf50' : '#888' }}
                    >
                      {member.status === 'online' ? '온라인' : '오프라인'}
                    </div>
                  </div>
                  <button
                    className={styles.chatButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(member);
                      setChatOpen(true);
                    }}
                  >
                    <i className='bx bx-message-rounded'></i>
                    채팅
                  </button>
                </div>
              </List.Item>
            )}
          />
        </div>

        {showConfirm && (
          <div className={styles.popupWrapper}>
            <div className={styles.popupRow}>
              <div className={styles.popupIcon}>!</div>
              <div>
                <div className={styles.popupTitle}>프로젝트 인원 삭제</div>
                <div className={styles.popupDesc}>정말로 선택한 멤버를 삭제하시겠습니까?</div>
              </div>
            </div>
            <div className={styles.popupButtonWrapper}>
              <button className={styles.popupButton} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className={styles.popupButton} onClick={handleDelete}>Yes</button>
            </div>
          </div>
        )}
      </Modal>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        members={memberList}
        projectId={projectId}
      />

      <ChatModal
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setSelectedMember(null);
        }}
        targetMember={selectedMember}
      />
    </>
  );
}