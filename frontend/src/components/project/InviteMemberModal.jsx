import React, { useState } from 'react';
import { Modal, Input, Button, Avatar, Typography, Card, Select, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from './css_folder/InviteMemberModal.module.css';

const { Title } = Typography;

export default function InviteMemberModal({ open, onClose, members = [], projectId }) {
  const { message } = App.useApp();
  const [email, setEmail] = useState('');
  const [fields, setFields] = useState('개발팀');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      message.warning('올바른 이메일 주소를 입력하세요.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[InviteMemberModal] 멤버 초대 시작:', { email: email.trim(), fields, projectId });
      
      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          fields: fields,
          project_id: projectId
        })
      });

      const data = await response.json();
      console.log('[InviteMemberModal] 초대 응답:', data);

      if (response.ok && data.success) {
        message.success('멤버 초대가 성공적으로 전송되었습니다.');
        setEmail('');
        onClose();
        
        // 즉시 멤버 목록 갱신 이벤트 발생
        console.log('[InviteMemberModal] 멤버 목록 갱신 이벤트 발생');
        window.dispatchEvent(new CustomEvent('refreshProjectMembers'));
        
        // 추가로 약간의 지연 후 다시 한 번 갱신 (서버 동기화를 위해)
        setTimeout(() => {
          console.log('[InviteMemberModal] 지연된 멤버 목록 갱신 이벤트 발생');
          window.dispatchEvent(new CustomEvent('refreshProjectMembers'));
        }, 1000);
        
        // 추가로 3초 후 한 번 더 갱신 (서버 처리 완료를 위해)
        setTimeout(() => {
          console.log('[InviteMemberModal] 최종 멤버 목록 갱신 이벤트 발생');
          window.dispatchEvent(new CustomEvent('refreshProjectMembers'));
        }, 3000);
      } else {
        message.error(data.message || '멤버 초대에 실패했습니다.');
      }
    } catch (error) {
      console.error('[InviteMemberModal] 멤버 초대 중 오류 발생:', error);
      message.error('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      title={null}
      centered
      styles={{ body: { padding: '15px', background: 'none', borderRadius: 0 } }}
    >
      <div className={styles.inviteContainer}>
        <div className={styles.leftBox}>
          <Title level={5} className={styles.title}>회원을 초대하세요</Title>
          <Input
            className={styles.emailInput}
            placeholder="이메일 주소를 입력해 주세요"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onPressEnter={handleInvite}
            autoFocus
          />
          <Select
            value={fields}
            onChange={value => setFields(value)}
            className={styles.teamSelect}
            options={[
              { value: '개발팀', label: '개발팀' },
              { value: '기획팀', label: '기획팀' },
              { value: '디자인팀', label: '디자인팀' },
            ]}
          />
          <Button type="primary" loading={loading} onClick={handleInvite} className={styles.inviteBtn}>
            초대하기
          </Button>
        </div>

        <Card 
          variant="borderless" 
          styles={{ body: { padding: 0, background: 'transparent' } }} 
          className={styles.rightBox}
        >
          <div className={styles.rightTitle}>Project Members</div>
          <div className={styles.memberList}>
            {members.map(member => (
              <div className={styles.memberItem} key={member.id}>
                <Avatar src={member.avatar} size={38} icon={<UserOutlined />} />
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{member.name}</div>
                  <div className={styles.memberSub} data-status={member.status}>
                    {member.status == 'online' ? '온라인' : '오프라인'}
                  </div>
                </div>
                <div className={styles.memberCaption}>{member.fields || '팀 미정'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Modal>
  );
}