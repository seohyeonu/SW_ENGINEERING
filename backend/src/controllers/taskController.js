const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const Notification = require('../models/notificationModel')

const TaskController = {
    // 업무 생성
    async createTask(req, res) {
    try {
        const { project_id, title, content, status, priority, dueDate, assignees } = req.body;
        const creator_id = req.user.id;

        console.log('📨 [업무 생성 요청] 받은 데이터:', {
        project_id,
        title,
        content,
        status,
        priority,
        dueDate,
        assignees,
        creator_id
        });

        // 유효성 검사
        if (!project_id || !title) {
        return res.status(400).json({
            success: false,
            message: '프로젝트 ID와 업무 제목은 필수입니다.'
        });
        }

        // 프로젝트 멤버 여부 확인
        const projectMembers = await Project.getMembers(project_id);
        const isMember = projectMembers.some(member => member.user_id === creator_id);
        if (!isMember) {
        return res.status(403).json({
            success: false,
            message: '이 프로젝트에 업무를 생성할 권한이 없습니다.'
        });
        }

        // assignees 유효성 검사
        const validAssigneeIds = Array.isArray(assignees) ? assignees.filter(id =>
        projectMembers.some(member => member.user_id === id)
        ) : [];

        if (validAssigneeIds.length !== (assignees?.length || 0)) {
        return res.status(400).json({
            success: false,
            message: '일부 담당자가 프로젝트 멤버가 아닙니다.'
        });
        }

        // 최종 데이터 가공
        const taskData = {
        project_id,
        title,
        content,
        status: status || 'not_started',
        priority: priority || 'middle',
        dueDate,
        assignees: validAssigneeIds.map(id => ({
            assignee_id: id,
            assigned_by: creator_id
        }))
        };

        console.log('[업무 생성 시도] 최종 데이터:', taskData);

        // 생성
        const task = await Task.create(taskData);
        console.log('[업무 생성 완료]', task);

        if (assignees && assignees.length > 0) {
            for (const assignee_id of assignees) {
                if (assignee_id !== creator_id) {
                await Notification.create({
                    user_id: assignee_id,
                    title: '새 업무가 할당되었습니다',
                    message: `[${title}] 업무가 당신에게 할당되었습니다.`
                });
                }
            }
        }

        return res.status(201).json({
        success: true,
        message: '업무가 성공적으로 생성되었습니다.',
        task
        });

    } catch (error) {
        console.error('[업무 생성 오류]:', error);
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

            console.log('TaskController - getProjectTasks - 요청 정보:', {
                projectId: projectId,
                userId: userId,
                paramType: typeof projectId
            });

            const projectMembers = await Project.getMembers(projectId);
            console.log('TaskController - getProjectTasks - 프로젝트 멤버 조회 결과:', projectMembers);

            const isMember = projectMembers.some(member => member.user_id === userId);
            console.log('TaskController - getProjectTasks - 멤버십 확인:', {
                isMember: isMember,
                userId: userId
            });

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
            // 알림 전송
            const io = req.app.get('io');
            const taskId = parseInt(req.params.taskId);
            const userId = req.user.user_id;

            const sanitizedData = {
            project_id: req.body.project_id,
            title: req.body.title,
            content: req.body.content,
            status: req.body.status,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            assignees: req.body.assignees,
            assigned_by: userId
            };

            // 업무 존재 확인
            const taskExists = await Task.exists(taskId);
            if (!taskExists) {
            return res.status(404).json({ success: false, message: '업무를 찾을 수 없습니다.' });
            }

            // 프로젝트 멤버 확인
            const projectMembers = await Project.getMembers(sanitizedData.project_id);
            const validAssignees = (sanitizedData.assignees || []).filter(a =>
            projectMembers.some(m => m.user_id === (a.assignee_id || a))
            );
            if (validAssignees.length !== sanitizedData.assignees.length) {
            return res.status(400).json({ success: false, message: '일부 담당자가 프로젝트 멤버가 아닙니다.' });
            }

            // 기존 할당자 목록 가져오기
            const oldAssignees = await Task.getTaskAssignees(taskId);
            const oldIds = oldAssignees.map(a => a.assignee_id);

            // 새 ID 목록 정제
            const newIds = (sanitizedData.assignees || []).map(a => 
            typeof a === 'object' ? a.assignee_id : a
            );

            // 변경된 목록 계산
            const added = newIds.filter(id => !oldIds.includes(id));
            const removed = oldIds.filter(id => !newIds.includes(id));

            // assignees 포맷을 Task.update에 맞게 변환
            sanitizedData.assignees = newIds.map(id => ({
                assignee_id: id,
                assigned_by: userId
            }));

            // 업무 업데이트
            const updated = await Task.update(taskId, sanitizedData);

            for (const user_id of added) {
            if (user_id !== userId) {
                const message = `[${sanitizedData.title}] 업무가 당신에게 새로 배정되었습니다.`;
                await Notification.create({ user_id, title: '업무가 새로 할당되었습니다', message });

                io?.to(`user-${user_id}`).emit('new-notification', {
                title: '업무가 새로 할당되었습니다',
                message,
                created_at: new Date(),
                is_read: 0
                });
            }
            }

            for (const user_id of removed) {
            if (user_id !== userId) {
                const message = `[${sanitizedData.title}] 업무에서 제외되었습니다.`;
                await Notification.create({ user_id, title: '업무에서 제외되었습니다', message });

                io?.to(`user-${user_id}`).emit('new-notification', {
                title: '업무에서 제외되었습니다',
                message,
                created_at: new Date(),
                is_read: 0
                });
            }
            }

            return res.status(200).json({
            success: true,
            message: '업무가 성공적으로 수정되었습니다.',
            task: updated
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
            const taskId = parseInt(req.params.taskId);
            const user = req.user;
            const userId = user?.user_id ?? user?.id; // 안전하게 유저 ID 추출

            console.log('[삭제 요청] taskId:', taskId);
            console.log('[삭제 요청] userId:', userId);

            const taskExists = await Task.exists(taskId);
            if (!taskExists) {
            return res.status(404).json({ success: false, message: '해당 업무를 찾을 수 없습니다.' });
            }

            const isProjectMember = await Task.isProjectMember(taskId, userId);
            if (!isProjectMember) {
            return res.status(403).json({ success: false, message: '업무를 삭제할 권한이 없습니다.' });
            }

            const deleted = await Task.delete(taskId);
            if (!deleted) throw new Error('업무 삭제에 실패했습니다.');

            return res.status(200).json({ success: true, message: '업무가 성공적으로 삭제되었습니다.' });

        } catch (error) {
            console.error('업무 삭제 중 오류 발생:', error);
            return res.status(500).json({
            success: false,
            message: '업무 삭제 중 오류가 발생했습니다.',
            error: error.message
            });
        }
    },

    // 업무 상세 조회 (삭제 전 확인용)
    async getTaskDetails(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            // 1. 업무 정보 조회
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '해당 업무를 찾을 수 없습니다.'
                });
            }

            // 2. 업무 조회 권한 확인
            const isProjectMember = await Task.isProjectMember(taskId, userId);
            if (!isProjectMember) {
                return res.status(403).json({
                    success: false,
                    message: '업무를 조회할 권한이 없습니다.'
                });
            }

            // 3. 업무 할당 정보 조회
            const assignees = await Task.getTaskAssignees(taskId);

            // 4. 응답 데이터 구성
            return res.status(200).json({
                success: true,
                task: {
                    ...task,
                    assignees
                }
            });

        } catch (error) {
            console.error('업무 조회 중 오류 발생:', error);
            return res.status(500).json({
                success: false,
                message: '업무 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    // TaskModel에 isProjectMember 메소드 추가 필요
    async isProjectMember(taskId, userId) {
        try {
            const [result] = await pool.query(
                `SELECT 1
                FROM task t
                JOIN project_member pm ON t.project_id = pm.project_id
                WHERE t.task_id = ? AND pm.user_id = ?
                LIMIT 1`,
                [taskId, userId]
            );
            return result.length > 0;
        } catch (error) {
            console.error('프로젝트 멤버 확인 중 오류 발생:', error);
            throw error;
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
    },

    // 업무 상태 변경
    async updateTaskStatus(req, res) {
        try {
            const taskId = parseInt(req.params.taskId);
            const { status } = req.body;
            const userId = req.user.id;

            // 1. 업무 존재 여부 확인
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '업무를 찾을 수 없습니다.'
                });
            }

            // 2. 프로젝트 멤버십 및 권한 확인
            const projectMembers = await Project.getMembers(task.project_id);
            const userRole = projectMembers.find(member => member.user_id === userId)?.role;

            // 매니저이거나 해당 업무의 담당자만 수정 가능
            const isAssignee = task.assignees.some(assignee => assignee.user_id === userId);
            if (!userRole || (userRole !== 'manager' && !isAssignee)) {
                return res.status(403).json({
                    success: false,
                    message: '이 업무를 수정할 권한이 없습니다.'
                });
            }

            // 3. 상태 업데이트
            const updatedTask = await Task.updateStatus(taskId, status);

            return res.status(200).json({
                success: true,
                message: '업무 상태가 성공적으로 변경되었습니다.',
                task: updatedTask
            });

        } catch (error) {
            console.error('업무 상태 변경 오류:', error);
            return res.status(500).json({
                success: false,
                message: '업무 상태 변경 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },
   
   
   
    // 5.29 작업 내용
    // 특정 사용자의 오늘 업무 목록 조회
    async getTodayTasksByUser(req, res) {
        try {
            const userId = req.user.id;
    
            console.log('TaskController - getTodayTasksByUser - 요청 정보:', {
                userId: userId
            });
    
            const tasks = await Task.findByAssigneeId(userId);
    
            return res.status(200).json({
                success: true,
                count: tasks.length,
                tasks
            });
    
        } catch (error) {
            console.error('오늘 업무 목록 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '오늘의 업무 목록 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
        }


};

module.exports = TaskController;
