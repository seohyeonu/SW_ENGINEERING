const Task = require('../models/taskModel');
const Project = require('../models/projectModel');

const TaskController = {
    // 업무 생성
    async createTask(req, res) {
        try {
            const { project_id, title, content, status, priority, dueDate, assignees } = req.body;
            const creator_id = req.user.id;

            if (!project_id || !title) {
                return res.status(400).json({
                    success: false,
                    message: '프로젝트 ID와 업무 제목은 필수입니다.'
                });
            }

            const projectMembers = await Project.getMembers(project_id);
            const isMember = projectMembers.some(member => member.user_id === creator_id);

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 프로젝트에 업무를 생성할 권한이 없습니다.'
                });
            }

            const taskData = {
                project_id,
                title,
                content,
                status: status || 'not_started',
                priority: priority || 'low',
                dueDate,
                assignees: assignees ? assignees.map(assignee_id => ({
                    assignee_id,
                    assigned_by: creator_id
                })) : []
            };

            const task = await Task.create(taskData);

            return res.status(201).json({
                success: true,
                message: '업무가 성공적으로 생성되었습니다.',
                task
            });
        } catch (error) {
            console.error('업무 생성 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // 프로젝트의 업무 목록 조회
    async getProjectTasks(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            const projectMembers = await Project.getMembers(projectId);
            const isMember = projectMembers.some(member => member.user_id === userId);

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 프로젝트의 업무를 조회할 권한이 없습니다.'
                });
            }

            const tasks = await Task.findByProjectId(projectId);

            return res.status(200).json({
                success: true,
                count: tasks.length,
                tasks
            });
        } catch (error) {
            console.error('프로젝트 업무 목록 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 목록 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // 특정 업무 상세 조회
    async getTaskById(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const task = await Task.findById(taskId);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '업무를 찾을 수 없습니다.'
                });
            }

            const projectMembers = await Project.getMembers(task.project_id);
            const isMember = projectMembers.some(member => member.user_id === userId);

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: '이 업무를 조회할 권한이 없습니다.'
                });
            }

            await Task.incrementViews(taskId);

            return res.status(200).json({
                success: true,
                task
            });
        } catch (error) {
            console.error('업무 상세 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // 업무 수정
    async updateTask(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const task = await Task.findById(taskId);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '업무를 찾을 수 없습니다.'
                });
            }

            const projectMembers = await Project.getMembers(task.project_id);
            const userRole = projectMembers.find(member => member.user_id === userId)?.role;

            if (!userRole || (userRole !== 'manager' && !task.assignees.some(assignee => assignee.user_id === userId))) {
                return res.status(403).json({
                    success: false,
                    message: '이 업무를 수정할 권한이 없습니다.'
                });
            }

            const updatedTask = await Task.update(taskId, updateData);

            return res.status(200).json({
                success: true,
                message: '업무가 성공적으로 수정되었습니다.',
                task: updatedTask
            });
        } catch (error) {
            console.error('업무 수정 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 수정 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // 업무 삭제
    async deleteTask(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const task = await Task.findById(taskId);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '업무를 찾을 수 없습니다.'
                });
            }

            const projectMembers = await Project.getMembers(task.project_id);
            const userRole = projectMembers.find(member => member.user_id === userId)?.role;

            if (userRole !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: '업무를 삭제할 권한이 없습니다.'
                });
            }

            await Task.delete(taskId);

            return res.status(200).json({
                success: true,
                message: '업무가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('업무 삭제 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 삭제 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // 사용자에게 할당된 업무 목록 조회
    async getUserTasks(req, res) {
        try {
            const userId = req.user.id;
            const tasks = await Task.findByAssigneeId(userId);

            return res.status(200).json({
                success: true,
                count: tasks.length,
                tasks
            });
        } catch (error) {
            console.error('사용자 업무 목록 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 목록 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = TaskController;
