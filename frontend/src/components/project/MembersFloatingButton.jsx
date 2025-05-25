import React, { useState, useEffect } from 'react';
import { Button, Modal, Checkbox, Avatar, List, message } from 'antd';
import InviteMemberModal from './InviteMemberModal';
import styles from './css_folder/MembersFloatingButton.module.css';

const defaultMembers = [
  { id: 1, name: '홍길동', active: true, team: '개발팀' },
  { id: 2, name: '김철수', active: true, team: '기획팀' },
  { id: 3, name: '이영민', active: false, team: '디자인팀' },
  { id: 4, name: '박민지', active: true, team: '개발팀' },
  { id: 5, name: '최은우', active: true, team: '디자인팀' },
  { id: 6, name: '장지훈', active: false, team: '기획팀' },
  { id: 7, name: '서하윤', active: true, team: '개발팀' },
  { id: 8, name: '배민정', active: true, team: '기획팀' },
  { id: 9, name: '이채현', active: true, team: '디자인팀' },
  { id: 10, name: '정우성', active: false, team: '개발팀' },
];

export default function MembersFloatingButton({ members = defaultMembers }) {
  const [open, setOpen] = useState(false);
  const [checkedList, setCheckedList] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [memberList, setMemberList] = useState(members);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleDelete = () => {
    setMemberList(list => list.filter(m => !checkedList.includes(m.id)));
    setCheckedList([]);
    setShowConfirm(false);
    setDeleteMode(false);
    message.success('프로젝트 인원 삭제 완료');
  };

  useEffect(() => {
    if (!open) setShowConfirm(false);
  }, [open]);

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
        bodyStyle={{ padding: 20, position: 'relative' }}
        afterClose={() => { setOpen(false); setDeleteMode(false); setCheckedList([]); setShowConfirm(false); }}
        onMouseLeave={() => { setOpen(false); setDeleteMode(false); setCheckedList([]); setShowConfirm(false); }}
      >
        {/* 리스트 영역 - 원래 높이로 복원 */}
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
                      <span className={styles.memberTeam}>{member.team}</span>
                    </div>
                    <div
                      className={styles.memberStatus}
                      style={{ color: member.active ? '#4caf50' : '#888' }}
                    >
                      {member.active ? '온라인' : '오프라인'}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        {/* 팝업은 리스트 외부에 위치 */}
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
      />
    </>
  );
}