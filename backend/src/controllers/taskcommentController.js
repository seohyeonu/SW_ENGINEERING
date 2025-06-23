const TaskComment = require('../models/taskcommentModel');
const pool = require('../config/database');

const TaskCommentController = {
    // 댓글 생성
    async createComment(req, res) {
        try {
            const { task_id, content } = req.body;
            const created_by = req.user?.id || req.user?.user_id;

            // 필수 유효성 검사
            if (!task_id || !content || !created_by) {
                return res.status(400).json({ error: 'task_id, content, created_by are required.' });
            }

            const comment = await TaskComment.create({
                task_id: parseInt(task_id),
                content,
                created_by: parseInt(created_by)
            });

            if (!comment) {
                return res.status(500).json({ error: 'Failed to create comment.' });
            }

            // 알림 전송
            const [[taskInfo]] = await pool.query(
                `SELECT t.title AS task_title, t.project_id
                 FROM task t
                 WHERE t.task_id = ?`,
                [task_id]
            );

            const [assignees] = await pool.query(
                `SELECT assignee_id FROM task_assignees 
                 WHERE task_id = ? AND assignee_id != ?`,
                [task_id, created_by]
            );

            const io = req.app.get('notificationIo');

            for (const { assignee_id } of assignees) {
                const title = '작업 댓글 등록';
                const message = `"${taskInfo.task_title}" 작업에 새로운 댓글이 등록되었습니다.`;

                // DB에 알림 저장
                await pool.query(
                    `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
                    [assignee_id, title, message]
                );

                // 실시간 알림 전송 (io가 있을 때만)
                if (io) {
                    io.to(`user-${assignee_id}`).emit('new-notification', {
                        title,
                        message,
                        created_at: new Date(),
                        is_read: 0,
                    });
                } else {
                    console.warn('[taskcommentController] io 객체가 없어 실시간 알림을 보낼 수 없습니다.');
                }
            }

            res.status(201).json(comment);

        } catch (error) {
            console.error('Error in TaskCommentController.createComment:', error);
            res.status(500).json({
                error: 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { details: error.message })
            });
        }
    },

    // 댓글 조회
    async getComments(req, res) {
        try {
            const { task_id } = req.params;

            const comments = await TaskComment.findByTaskId(parseInt(task_id));
            res.status(200).json(comments);
        } catch (error) {
            console.error('Error in TaskCommentController.getComments:', error);
            res.status(500).json({
                error: 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { details: error.message })
            });
        }
    }
};

module.exports = TaskCommentController;
