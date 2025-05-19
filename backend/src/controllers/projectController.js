const Project = require('../models/projectModel');
const User = require('../models/userModel');

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
            const userId = req.user.id; // JWT 미들웨어에서 추출한 사용자 ID
            
            const projects = await Project.findByUserId(userId);
            
            return res.status(200).json({
                success: true,
                count: projects.length,
                projects
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
    
    // 프로젝트 삭제
    async deleteProject(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;
            
            // 프로젝트 조회
            const project = await Project.findById(projectId);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: '프로젝트를 찾을 수 없습니다.'
                });
            }
            
            // 현재 사용자가 프로젝트 매니저인지 확인
            if (project.manager_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: '프로젝트를 삭제할 권한이 없습니다.'
                });
            }
            
            // 프로젝트 삭제
            const deleted = await Project.delete(projectId);
            
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: '프로젝트 삭제에 실패했습니다.'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: '프로젝트가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('프로젝트 삭제 오류:', error);
            return res.status(500).json({
                success: false,
                message: '프로젝트 삭제 중 오류가 발생했습니다.',
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
}

module.exports = new ProjectController();
