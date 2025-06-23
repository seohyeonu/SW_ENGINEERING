import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Table, Avatar, Button, Dropdown, Menu, Input, Checkbox } from 'antd';
import { UserOutlined, MoreOutlined, DownOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import styles from './css_folder/History.module.css';

const History = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const teamList = ['기획팀', '디자인팀', '개발팀'];
  const [selectedProject, setSelectedProject] = useState('');
  const [projectList, setProjectList] = useState([]);
  const filteredProjects = projectList.filter(p =>
    p.project_name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // 내가 참여하는 프로젝트를 참조해서 관련된 로그 가져오기
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs/mine', {  // 수정된 부분
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.logs)) throw new Error();

        const formatted = data.logs.map((log, i) => {
          const dateObj = new Date(log.created_at);
          return {
            key: `${log.project_id}_${log.created_at}`,
            log_id: log.log_id,
            user: {
              name: log.username || '알 수 없음',
              team: log.department || '미지정',
            },
            activity: log.content,
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: dateObj.toLocaleDateString(),
            ago: '',
            project_name: log.project_name || '',
            project_id: log.project_id || '', // navigate 가능
          };
        });
        setAllLogs(formatted);
        setDataSource(formatted);
      } catch {
        console.error('⚠️ 로그 불러오기 실패');
        setDataSource([]);
      }
    };

    fetchLogs();
  }, []);

  // 내가 가진 프로젝트 목록 가져오기
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects/mine', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjectList(data.projects);
        }
      } catch {
        console.error('⚠️ 프로젝트 목록 불러오기 실패');
      }
    };

    fetchProjects();
  }, []);


  const handleUserSearch = (value) => {
    setSearchValue(value);
    applyFilters(value, selectedTeam, selectedProject);
  };

  const applyFilters = (nameFilter, teamFilter, projectFilter) => {
    let filtered = [...allLogs];

    if (nameFilter) {
      filtered = filtered.filter(log =>
        log.user.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (teamFilter) {
      filtered = filtered.filter(log => log.user.team === teamFilter);
    }

    if (projectFilter) {
      filtered = filtered.filter(log => log.project_name === projectFilter);
    }

    setDataSource(filtered);
  };

  const handleTeamFilterChange = (team) => {
    const newTeam = team === selectedTeam ? '' : team;
    setSelectedTeam(newTeam);
    applyFilters(searchValue, newTeam, selectedProject);
  };

  const menu = (
    <Menu>
      <Menu.Item key="goto">바로가기</Menu.Item>
      <Menu.Item key="delete">삭제하기</Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div className={styles.avatarBlock}>
          <Avatar size={36} icon={<UserOutlined />} style={{ background: '#e0e0e0' }} />
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userTeam}>{user.team}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      render: (text) => <div className={styles.activityText}>{text}</div>,
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      render: (time, row) => (
        <div className={styles.timeBlock}>
          <span className={styles.timeText}>{time}</span>
          <span className={styles.dateText}>{row.date}</span>
        </div>
      ),
    },
    {
      title: '',
      key: 'ago',
      render: (_, row) => {
        const items = [
          {
            label: '바로가기',
            key: 'goto',
          },
          {
            label: '삭제하기',
            key: 'delete',
          },
        ];

        const handleMenuClick = async ({ key }) => {
          if (key === 'goto' && row.project_id) {
            try {
              const res = await fetch(`/api/projects/${row.project_id}`, {
                method: 'GET',
                credentials: 'include',
              });
              const data = await res.json();

              if (data.success && data.project) {
                navigate(`/project/${row.project_id}`, {
                  state: { project: data.project },
                });
              } else {
                console.error('프로젝트 데이터 없음');
              }
            } catch (err) {
              console.error('프로젝트 불러오기 실패:', err);
            }
          }

          if (key === 'delete' && row.log_id) {
            if (!window.confirm('정말 이 로그를 삭제하시겠습니까?')) return;
            try {
              const res = await fetch(`/api/logs/${row.log_id}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              const result = await res.json();
              if (result.success) {
                // 삭제 성공 시 UI에서 제거
                setDataSource(prev => prev.filter(item => item.log_id !== row.log_id));
                setAllLogs(prev => prev.filter(item => item.log_id !== row.log_id));
              } else {
                alert('삭제에 실패했습니다.');
              }
            } catch (err) {
              console.error('삭제 요청 실패:', err);
            }
          }
        };


        return (
          <div className={styles.agoBlock}>
            <span className={styles.agoText}>{row.ago}</span>
            <Dropdown
              menu={{ items, onClick: handleMenuClick }} // ✅ 여기에 row 포함됨
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.wrapper}>
      <style jsx="true">{`
        .ant-table {
          min-width: 800px;
          max-width: 100%;
          overflow-x: auto;
          background: #fff;
          border-radius: 0 !important;
          box-shadow: 0 2px 8px 0 rgba(31, 38, 135, 0.04);
        }

        .ant-table-thead > tr > th {
          background: rgba(119, 166, 242, 0.98) !important;
          color: #fff !important;
          font-weight: 600;
          font-size: 16px;
          border: none;
          height: 48px;
          padding: 0 0 0 28px;
          text-align: left;
          vertical-align: middle;
          position: relative;
        }
      `}</style>

      <div className={styles.header}>
        <Button className={styles.projectButton} 
        onClick={() => {
          setSelectedTeam('');
          setSelectedProject('');
          setSearchValue('');
          applyFilters('', '', '');
        }}>ALL</Button>
        <Button className={styles.projectButton} onClick={() => setShowProjectDropdown(v => !v)}>
          Projects <DownOutlined />
        </Button>

        {showProjectDropdown && (
          <div className={styles.projectDropdown}>
            <Input
              placeholder="Search project"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              allowClear
              size="middle"
              style={{ marginBottom: 8 }}
            />
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              {filteredProjects.length === 0 ? (
                <div className={styles.projectEmpty}>No projects</div>
              ) : (
                filteredProjects.map(project => (
                <div
                  key={project.project_id}
                  className={styles.projectItem}
                  onClick={() => {
                    setShowProjectDropdown(false);
                    setSelectedProject(project.project_name); // 상태 업데이트
                    applyFilters(searchValue, selectedTeam, project.project_name); // 필터링 호출
                  }}
                >
                  {project.project_name}
                </div>
              ))
              )}
            </div>
          </div>
        )}

        <div className={styles.actionButtons}>
          {showSearch && (
            <Input
              placeholder="사용자 이름 검색"
              allowClear
              size="middle"
              value={searchValue}
              onChange={e => handleUserSearch(e.target.value)}
              style={{ width: 200, marginLeft: 12 }}
            />
          )}
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={() => {
              setShowSearch(v => !v);
              setShowFilter(false);
            }}
          />
          <Button
            type="text"
            icon={<FilterOutlined />}
            onClick={() => {
              setShowFilter(v => !v);
              setShowSearch(false);
            }}
          />
          {showFilter && (
            <div className={styles.filterBox}>
              <div className={styles.teamLabel}>팀 선택</div>
              {teamList.map(team => (
                <div key={team} className={styles.teamItem}>
                  <Checkbox
                    checked={team === selectedTeam}
                    onChange={() => handleTeamFilterChange(team)}
                  >
                    {team}
                  </Checkbox>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Table
        className={styles.tableStyle}
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        rowKey="key"  // 고유 키 제대로 지정
        scroll={{ y: 840, x: 'max-content' }}
      />
    </div>
  );
};

export default History;