const Project = require('../models/projectModel');
const User = require('../models/userModel');
const pool = require('../config/database');
const Announcement = require('../models/announcementModel');
const AnnouncementComment = require('../models/announcementcommentModel');
const Task = require('../models/taskModel');
const TaskComment = require('../models/taskcommentModel');
const Log = require('../models/logModel');

class ProjectController {
    // 프로젝트 생성
    async createProject(req, res) {
        try {
            
            const { project_name, description, start_date, end_date } = req.body;
            const manager_id = req.user.id; // JWT 미들웨어에서 추출한 사용자 ID
            
            // 필수 필드 검증
            if (!project_name) {
                return res.status(400).json({
                    success: false,
                    message: '프로젝트 이름은 필수입니다.'
                });
            }
            
            const projectData = {
                manager_id,
                project_name,
                description,
                start_date,
                end_date
            };
            
            const project = await Project.create(projectData);
            
            return res.status(201).json({
                success: true,
                message: '프로젝트가 성공적으로 생성되었습니다.',
                project
            });
        } catch (error) {
            console.error('프로젝트 생성 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 사용자별 프로젝트 목록 조회
    async getUserProjects(req, res) {
        try {
            // 인증 미들웨어가 비활성화된 경우를 위한 임시 처리
            let userId;
            
            if (req.user && req.user.id) {
                // 인증된 사용자의 ID 사용
                userId = req.user.id;
                console.log(`[프로젝트 컨트롤러] 인증된 사용자 ID: ${userId}`);
            } else {
                // 개발 중이므로 테스트용 사용자 ID 사용 (문영훈님 ID: 8)
                userId = 8;
                console.log(`[프로젝트 컨트롤러] 테스트용 사용자 ID: ${userId}`);
            }
            
            console.log(`[프로젝트 컨트롤러] 사용자 ID ${userId}의 프로젝트 조회 시작`);
            const projects = await Project.findByUserId(userId);
            console.log(`[프로젝트 컨트롤러] 조회된 프로젝트 수: ${projects.length}`);
            
            // 날짜 형식 변환
            const formattedProjects = projects.map(project => {
                // 원본 데이터 복사
                const formattedProject = { ...project };
                
                // 날짜 형식 변환 (YYYY-MM-DDThh:mm:ss.sss -> YYYY-MM-DD)
                if (formattedProject.start_date) {
                    formattedProject.start_date = new Date(formattedProject.start_date).toISOString().split('T')[0];
                }
                
                if (formattedProject.end_date) {
                    formattedProject.end_date = new Date(formattedProject.end_date).toISOString().split('T')[0];
                }
                
                if (formattedProject.created_at) {
                    formattedProject.created_at = new Date(formattedProject.created_at).toISOString().split('T')[0];
                }
                
                if (formattedProject.updated_at) {
                    formattedProject.updated_at = new Date(formattedProject.updated_at).toISOString().split('T')[0];
                }
                
                return formattedProject;
            });
            
            console.log(`[프로젝트 컨트롤러] 변환된 프로젝트 데이터:`, formattedProjects);
            
            return res.status(200).json({
                success: true,
                count: formattedProjects.length,
                projects: formattedProjects
            });
        } catch (error) {
            console.error('사용자 프로젝트 목록 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 목록 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 프로젝트 상세 조회
    async getProjectById(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;
            
            // 프로젝트 조회 (매니저 이름 포함)
            const project = await Project.findByIdWithManagerName(projectId);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
            
            // 프로젝트 멤버 목록 조회
            const members = await Project.getMembers(projectId);
            
            // 현재 사용자가 프로젝트 멤버인지 확인
            const isMember = members.some(member => member.user_id === userId);
            
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 프로젝트에 접근할 권한이 없습니다.'
                });
            }
            
            // 응답 데이터 구성
            const projectData = {
                ...project,
                members
            };
            
            return res.status(200).json({
                success: true,
                project: projectData
            });
        } catch (error) {
            console.error('프로젝트 상세 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 프로젝트 업데이트
    async updateProject(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;
            
            // 프로젝트 조회
            const project = await Project.findById(projectId);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
            
            // 프로젝트 멤버 목록 조회
            const members = await Project.getMembers(projectId);
            
            // 현재 사용자가 프로젝트 매니저인지 확인
            const userRole = members.find(member => member.user_id === userId)?.role;
            
            if (userRole !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: '프로젝트를 수정할 권한이 없습니다.'
                });
            }
            
            // 매니저 변경 시 유효한 사용자인지 확인
            if (updateData.manager_id && updateData.manager_id !== project.manager_id) {
                const newManager = await User.findById(updateData.manager_id);
                
                if (!newManager) {
                    return res.status(400).json({
                        success: false,
                        message: '유효하지 않은 매니저 ID입니다.'
                    });
                }
            }
            
            // 프로젝트 업데이트
            const updatedProject = await Project.update(projectId, updateData);
            
            return res.status(200).json({
                success: true,
                message: '프로젝트가 성공적으로 업데이트되었습니다.',
                project: updatedProject
            });
        } catch (error) {
            console.error('프로젝트 업데이트 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 업데이트 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
 
    
    // 프로젝트에 사용자 추가
    async addUserToProject(req, res) {
        try {
            const { projectId } = req.params;
            const { userId, role } = req.body;
            const currentUserId = req.user.id;
            
            // 필수 필드 검증
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: '사용자 ID는 필수입니다.'
                });
            }
            
            // 프로젝트 조회
            const project = await Project.findById(projectId);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
            
            // 현재 사용자가 프로젝트 매니저인지 확인
            if (project.manager_id !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: '사용자를 추가할 권한이 없습니다.'
                });
            }
            
            // 추가할 사용자가 존재하는지 확인
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '추가할 사용자를 찾을 수 없습니다.'
                });
            }
            
            // 사용자 추가
            await Project.addUser(projectId, userId, role || 'member');
            
            return res.status(200).json({
                success: true,
                message: '사용자가 프로젝트에 성공적으로 추가되었습니다.'
            });
        } catch (error) {
            console.error('프로젝트 사용자 추가 오류:', error);
            return res.status(500).json({
                success: false,
                message: '사용자 추가 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 프로젝트에서 사용자 제거
    async removeUserFromProject(req, res) {
        try {
            const { projectId, userId } = req.params;
            const currentUserId = req.user.id;
            
            // 프로젝트 조회
            const project = await Project.findById(projectId);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
            
            // 현재 사용자가 프로젝트 매니저인지 확인
            if (project.manager_id !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: '사용자를 제거할 권한이 없습니다.'
                });
            }
            
            // 매니저를 제거하려는 경우
            if (parseInt(userId) === project.manager_id) {
                return res.status(400).json({
                    success: false,
                    message: '프로젝트 매니저는 제거할 수 없습니다.'
                });
            }
            
            // 사용자 제거
            const removed = await Project.removeUser(projectId, userId);
            
            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: '해당 사용자가 프로젝트에 속해있지 않습니다.'
                });
            }

            const io = req.app.get('io');
            await pool.query(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [userId, '프로젝트 추방', `"${project.project_name}" 프로젝트에서 추방되었습니다.`]
            );
            io.to(`user-${userId}`).emit('new-notification', {
                title: '프로젝트 추방',
                message: `"${project.project_name}" 프로젝트에서 추방되었습니다.`,
                created_at: new Date(),
                is_read: 0,
            });
            
            return res.status(200).json({
                success: true,
                message: '사용자가 프로젝트에서 성공적으로 제거되었습니다.'
            });
        } catch (error) {
            console.error('프로젝트 사용자 제거 오류:', error);
            return res.status(500).json({
                success: false,
                message: '사용자 제거 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 모든 프로젝트 목록 조회 (관리자용)
    async getAllProjects(req, res) {
        try {
            // 관리자 권한 확인 로직 추가 가능
            
            const projects = await Project.findAll();
            
            return res.status(200).json({
                success: true,
                count: projects.length,
                projects
            });
        } catch (error) {
            console.error('프로젝트 목록 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 목록 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 프로젝트 설명(개요) 수정
    async updateProjectDescription(req, res) {
    try {
        const projectId = req.params.id;
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, message: '설명은 필수입니다.' });
        }

        const updatedProject = await Project.updateDescription(projectId, description);
        if (!updatedProject) {
            return res.status(404).json({ success: false, message: '프로젝트를 찾을 수 없습니다.' });
        }

        return res.status(200).json({ success: true, project: updatedProject });
    } catch (error) {
        console.error('프로젝트 설명 수정 오류:', error);
        return res.status(500).json({ success: false, message: '프로젝트 설명 수정 중 오류 발생', error: error.message });
    }
    }

    // 프로젝트 멤버 목록 조회
    async getMembers(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            console.log('ProjectController - getMembers - 요청 정보:', {
                projectId,
                userId
            });

            // 프로젝트 존재 여부 확인
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }

            // 현재 사용자가 프로젝트 멤버인지 확인
            const members = await Project.getMembers(projectId);
            const isMember = members.some(member => member.user_id === userId);

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 프로젝트의 멤버를 조회할 권한이 없습니다.'
                });
            }

            return res.status(200).json({
                success: true,
                members: members
            });

        } catch (error) {
            console.error('프로젝트 멤버 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 멤버 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 프로젝트의 특정 팀 멤버 조회
    async getTeamMembers(req, res) {
        try {
            const { projectId, team } = req.params;
            const userId = req.user.id;

            console.log('ProjectController - getTeamMembers - 요청 정보:', {
                projectId,
                team,
                userId
            });

            // 프로젝트 멤버십 확인
            const projectMembers = await Project.getMembers(projectId);
            const isMember = projectMembers.some(member => member.user_id === userId);

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 프로젝트의 멤버를 조회할 권한이 없습니다.'
                });
            }

            // 특정 팀 멤버 조회
            const [results] = await pool.query(
                `SELECT u.user_id, u.name 
                 FROM project_mapping p 
                 JOIN user u ON p.user_id = u.user_id 
                 WHERE p.fields = ? 
                 AND p.project_id = ?`,
                [team, projectId]
            );

            return res.status(200).json({
                success: true,
                members: results
            });

        } catch (error) {
            console.error('팀 멤버 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '팀 멤버 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 프로젝트 이름 조회
     async getProjectName(req, res) {
        const { id } = req.params;

        try {
            const project = await Project.findById(id);
            if (!project) {
            return res.status(404).json({ success: false, message: '해당 프로젝트를 찾을 수 없습니다.' });
        }

      res.json({ success: true, project_name: project.project_name });
    } catch (error) {
      console.error('프로젝트 이름 조회 오류:', error);
      res.status(500).json({ success: false, message: '서버 오류' });
    }
    }

  // 현재 로그인한 사용자의 프로젝트 목록 조회
  async getMyProjects(req, res) {
    try {
        const userId = req.user?.user_id || req.user?.id; // 안전하게 처리
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const projects = await Project.findByUserId(userId);
        res.status(200).json({ success: true, projects });
    } catch (err) {
        console.error('내 프로젝트 목록 조회 오류:', err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
  }

   /*
    5.28 작업 내용*/
        // 프로젝트 삭제
    async deleteProject(req, res) {
            try {
                const { projectId } = req.params;
                const userId = req.user.id;  // JWT 토큰에서 사용자 ID 가져오기
                
                console.log('[백엔드] 프로젝트 삭제 요청:', {
                    projectId,
                    userId,
                    user: req.user,
                    headers: req.headers
                });
                
                // 1. 프로젝트 존재 여부 확인
                const project = await Project.findById(projectId);
                console.log('[백엔드] 프로젝트 조회 결과:', project);
    
                if (!project) {
                    console.log('[백엔드] 프로젝트를 찾을 수 없음');
                    return res.status(404).json({
                        success: false,
                        message: '프로젝트를 찾을 수 없습니다.'
                    });
                }
    
                // 2. 현재 사용자가 프로젝트 매니저인지 확인
                console.log('[백엔드] 매니저 권한 확인:', {
                    projectManagerId: project.manager_id,
                    requestUserId: userId,
                    isManager: project.manager_id === userId
                });
    
                if (project.manager_id !== userId) {
                    console.log('[백엔드] 프로젝트 삭제 권한 없음');
                    return res.status(403).json({
                        success: false,
                        message: '프로젝트를 삭제할 권한이 없습니다.'
                    });
                }
    
                console.log('[백엔드] 프로젝트 관련 데이터 삭제 시작');
    
                // 3. 공지 댓글 삭제
                await AnnouncementComment.deleteByProjectId(projectId);
                console.log('[백엔드] 공지 댓글 삭제 완료');
    
                // 4. 공지 삭제
                await Announcement.deleteAnnouncementsByProjectId(projectId);
                console.log('[백엔드] 공지 삭제 완료');
    
                // 5. 작업 댓글 삭제
                await TaskComment.deleteByProjectId(projectId);
                console.log('[백엔드] 작업 댓글 삭제 완료');
    
                // 6. 작업 할당 정보 삭제
                await Task.deletetaskassigneesByProjectId(projectId);
                console.log('[백엔드] 작업 할당 정보 삭제 완료');
    
                // 7. 작업 삭제
                await Task.deleteByProjectId(projectId);
                console.log('[백엔드] 작업 삭제 완료');
    
                // 8. 프로젝트 사용자 매핑 삭제
                await Project.deleteProjectMapping(projectId);
                console.log('[백엔드] 프로젝트 사용자 매핑 삭제 완료');


                //9. 로그 삭제
                await Log.deleteByProjectId(projectId);
                console.log('[백엔드] 로그 삭제 완료');
    
                // 9. 프로젝트 삭제
                await Project.deleteProject(projectId);
                console.log('[백엔드] 프로젝트 삭제 완료');
    
                console.log('[백엔드] 프로젝트 삭제 성공');
                return res.status(200).json({
                    success: true,
                    message: '프로젝트가 성공적으로 삭제되었습니다.'
                });
    
            } catch (error) {
                console.error('[백엔드] 프로젝트 삭제 오류:', error);
                return res.status(500).json({
                    success: false,
                    message: '프로젝트 삭제 중 오류가 발생했습니다.',
                    error: error.message
                });
            }
        }

    //프로젝트 팀원 초대
    async inviteMember(req, res) {
        try {
            const { projectId } = req.params;
            const { email, fields } = req.body;
            const userId = req.user.id; // 로그인한 사용자 ID (보통 매니저일 것)
    
            console.log('[백엔드] 팀원 초대 요청:', {
                projectId,
                email,
                fields,
                inviterId: userId
            });
    
            // 1. 프로젝트 존재 여부 확인
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
    
            // 2. 현재 사용자가 프로젝트 매니저인지 확인
            if (project.manager_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: '프로젝트에 팀원을 초대할 권한이 없습니다.'
                });
            }
    
            // 3. 팀원 초대 수행
            const result = await Project.inviteMemberByEmail(projectId, email, fields);

            // #. 알림 추가
            const invitedUserId = result.userId;

            // 알림 전송 준비
            const io = req.app.get('notificationIo');
            const [[projectInfo]] = await pool.query('SELECT project_name FROM project WHERE project_id = ?', [projectId]);
            await pool.query(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [invitedUserId, '프로젝트 초대', `"${projectInfo.project_name}" 프로젝트에 초대되었습니다.`]
            );

            // 실시간 알림 보내기 (io가 있을 때만)
            if (io) {
                io.to(`user-${invitedUserId}`).emit('new-notification', {
                    title: '프로젝트 초대',
                    message: `"${projectInfo.project_name}" 프로젝트에 초대되었습니다.`,
                    created_at: new Date(),
                    is_read: 0,
                });
            } else {
                console.warn('[백엔드] io 객체가 없어 실시간 알림을 보낼 수 없습니다.');
            }


            return res.status(200).json({
                success: true,
                message: '팀원이 성공적으로 초대되었습니다.',
                invitedUserId: result.userId
            });
    
        } catch (error) {
            console.error('[백엔드] 팀원 초대 오류:', error);
            return res.status(500).json({
                success: false,
                message: '팀원 초대 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    //프로젝트 팀원 초대
    async getProjectMemerListAtTeam(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;  // 인증된 사용자 ID

            console.log('[ProjectController] getProjectMemerListAtTeam 호출됨:', {
                projectId,
                userId,
                params: req.params,
                query: req.query
            });

            // 프로젝트 존재 여부 확인
            const project = await Project.findById(projectId);
            if (!project) {
                console.log('[ProjectController] 프로젝트를 찾을 수 없음:', projectId);
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }

            console.log('[ProjectController] 프로젝트 찾음:', project);

            // 팀원 목록 조회
            const memberList = await Project.getProjectMemerListAtTeam(projectId);
            
            console.log('[ProjectController] 조회된 멤버 목록:', memberList);

            return res.status(200).json({
                success: true,
                members: memberList
            });
        } catch (error) {
            console.error('[ProjectController] 프로젝트 멤버 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 멤버 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 프로젝트 멤버 삭제
    async deleteMembers(req, res) {
        try {
            const { projectId } = req.params;
            const { memberIds } = req.body;

            if (!Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '삭제할 멤버를 선택해주세요.'
                });
            }

            // 프로젝트 존재 여부 확인
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }

            // 요청한 사용자가 매니저인지 확인
            const isManager = await Project.isManager(projectId, req.user.id);
            if (!isManager) {
                return res.status(403).json({
                    success: false,
                    message: '프로젝트 매니저만 멤버를 삭제할 수 있습니다.'
                });
            }

            // 멤버 삭제 실행
            const deletedCount = await Project.deleteProjectMembers(projectId, memberIds);

            // 알림 및 실시간 전송
            const io = req.app.get('notificationIo');

            const [[projectInfo]] = await pool.query('SELECT project_name FROM project WHERE project_id = ?', [projectId]);

            for (const memberId of memberIds) {
                // DB에 알림 저장
                await pool.query(
                    'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                    [memberId, '프로젝트 추방', `"${projectInfo.project_name}" 프로젝트에서 추방되었습니다.`]
                );

                // 실시간 알림 전송 (io가 있을 때만)
                if (io) {
                    io.to(`user-${memberId}`).emit('new-notification', {
                        title: '프로젝트 추방',
                        message: `"${projectInfo.project_name}" 프로젝트에서 추방되었습니다.`,
                        created_at: new Date(),
                        is_read: 0,
                    });
                } else {
                    console.warn('[백엔드] io 객체가 없어 실시간 알림을 보낼 수 없습니다.');
                }
            }

            res.json({
                success: true,
                message: `${deletedCount}명의 멤버가 삭제되었습니다.`,
                deletedCount
            });

        } catch (error) {
            console.error('프로젝트 멤버 삭제 중 오류:', error);
            res.status(500).json({
                success: false,
                message: error.message || '멤버 삭제 중 오류가 발생했습니다.'
            });
        }
    }


}

module.exports = new ProjectController();