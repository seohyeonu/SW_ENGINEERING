import React, { useState } from 'react';
import { Modal, Input, Button, Avatar, Typography, Card, message, Select } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from './css_folder/InviteMemberModal.module.css';

const { Title } = Typography;

export default function InviteMemberModal({ open, onClose, members = [] }) {
  const [email, setEmail] = useState('');
  const [team, setTeam] = useState('개발팀');
  const [loading, setLoading] = useState(false);

  const handleInvite = () => {
    if (!email || !email.includes('@')) {
      message.warning('올바른 이메일 주소를 입력하세요.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail('');
      message.success(`${team}에 초대 링크가 전송되었습니다!`);
    }, 1000);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      title={null}
      centered
      bodyStyle={{ padding: '15px', background: 'none', borderRadius: 0 }}
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
            value={team}
            onChange={value => setTeam(value)}
            className={styles.teamSelect}
            options={[
              { value: '개발팀', label: '개발팀' },
              { value: '기획팀', label: '기획팀' },
              { value: '디자인팀', label: '디자인팀' },
            ]}
          />
          <Button type="primary" loading={loading} onClick={handleInvite} className={styles.inviteBtn}>
            링크로 초대하기
          </Button>
        </div>

        <Card bordered={false} bodyStyle={{ padding: 0, background: 'transparent' }} className={styles.rightBox}>
          <div className={styles.rightTitle}>Project Members</div>
          <div className={styles.memberList}>
            {members.map(member => (
              <div className={styles.memberItem} key={member.id}>
                <Avatar src={member.avatar} size={38} icon={<UserOutlined />} />
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{member.name}</div>
                  <div className={styles.memberSub}>{member.active ? '온라인' : '오프라인'}</div>
                </div>
                <div className={styles.memberCaption}>{member.team || '팀 미정'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Modal>
  );
}