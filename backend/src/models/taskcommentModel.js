// taskCommentModel.js
const pool = require('../config/database'); // 데이터베이스 연결 풀 경로 확인

class TaskComment {
    constructor(comment) {
        this.comment_id = comment.comment_id;
        this.task_id = comment.task_id;
        this.content = comment.content;
        this.created_at = comment.created_at;
        this.updated_at = comment.updated_at;
        this.created_by = comment.created_by; // user_id (INT)
    }

    /**
     * 새로운 업무 댓글을 생성합니다.
     * @param {object} commentData - 생성할 댓글 데이터 (task_id, content, created_by)
     * @returns {Promise<TaskComment|null>} - 생성된 TaskComment 객체 또는 null
     */
    static async create(commentData) {
        try {
            const [result] = await pool.query(
                'INSERT INTO task_comments (task_id, content, created_by) VALUES (?, ?, ?)',
                [
                    commentData.task_id,
                    commentData.content,
                    commentData.created_by // User ID (INT)
                ]
            );

            if (result.insertId) {
                // 방금 생성된 댓글의 전체 정보를 조회하여 반환
                const [comments] = await pool.query(
                    'SELECT * FROM task_comments WHERE comment_id = ?',
                    [result.insertId]
                );
                return comments[0] ? new TaskComment(comments[0]) : null;
            }
            return null;
        } catch (error) {
            console.error('Error in TaskComment.create:', error);
            throw error;
        }
    }

    /**
     * 특정 업무(task)의 모든 댓글을 조회합니다.
     * 댓글과 작성자 정보를 함께 가져오기 위해 JOIN을 사용합니다.
     * @param {number} taskId - 댓글을 조회할 업무의 ID
     * @returns {Promise<Array<TaskComment>>} - TaskComment 객체 배열
     */
    static async findByTaskId(taskId) {
        try {
            // user 테이블과 조인하여 작성자 정보(예: name)를 함께 가져올 수 있습니다.
            // 여기서는 user_id만 가져오고, 클라이언트에서 username을 필요로 할 경우 별도 요청하거나
            // user 모델에서 username을 가져오는 로직을 추가해야 합니다.
            // 더 나아가, SELECT 문에 user.username AS created_by_username 과 같이 필드를 추가하고
            // TaskComment constructor에 해당 필드를 추가할 수도 있습니다.
            const [comments] = await pool.query(
                `SELECT tc.*, u.username as created_by_name
                 FROM task_comments tc
                 JOIN user u ON tc.created_by = u.user_id
                 WHERE tc.task_id = ?
                 ORDER BY tc.created_at ASC`,
                [taskId]
            );
            return comments.map(commentData => {
                const comment = new TaskComment(commentData);
                comment.created_by_name = commentData.created_by_name; // 조인된 사용자 이름 추가
                return comment;
            });
        } catch (error) {
            console.error('Error in TaskComment.findByTaskId:', error);
            throw error;
        }
    }

    /**
     * ID로 특정 댓글을 찾습니다.
     * @param {number} commentId - 조회할 댓글의 ID
     * @returns {Promise<TaskComment|null>} - TaskComment 객체 또는 null
     */
    static async findById(commentId) {
        try {
            const [comments] = await pool.query(
                `SELECT tc.*, u.username as created_by_name
                 FROM task_comments tc
                 JOIN user u ON tc.created_by = u.user_id
                 WHERE tc.comment_id = ?`,
                [commentId]
            );
            if (comments[0]) {
                const comment = new TaskComment(comments[0]);
                comment.created_by_name = comments[0].created_by_name;
                return comment;
            }
            return null;
        } catch (error) {
            console.error('Error in TaskComment.findById:', error);
            throw error;
        }
    }

    /**
     * 댓글 내용을 업데이트합니다.
     * @param {string} newContent - 새로운 댓글 내용
     * @returns {Promise<boolean>} - 업데이트 성공 여부
     */
    async updateContent(newContent) {
        try {
            const [result] = await pool.query(
                'UPDATE task_comments SET content = ? WHERE comment_id = ?',
                [newContent, this.comment_id]
            );
            if (result.affectedRows > 0) {
                this.content = newContent;
                // updated_at은 DB에서 자동으로 업데이트되지만, 최신 정보를 반영하려면 다시 조회하는 것이 좋습니다.
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error in TaskComment.updateContent:', error);
            throw error;
        }
    }

    /**
     * 특정 댓글을 삭제합니다.
     * @param {number} commentId - 삭제할 댓글의 ID
     * @returns {Promise<boolean>} - 삭제 성공 여부
     */
    static async delete(commentId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM task_comments WHERE comment_id = ?',
                [commentId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in TaskComment.delete:', error);
            throw error;
        }
    }


    //5.28 작업 내용
    // 프로젝트 삭제 시 작업 댓글 삭제
    static async deleteByProjectId(projectId) {
        try {
            await pool.query(
                "DELETE FROM task_comments WHERE task_id IN (SELECT task_id FROM task WHERE project_id = ?)",
                [projectId]
            );
        } catch (error) {
            console.error('Error in TaskComment.deleteByProjectId:', error);
            throw error;
        }
    }   



    // 민감한 정보를 제외한 댓글 정보 반환 (여기서는 딱히 민감 정보는 없지만 패턴 유지)
    toJSON() {
        const comment = { ...this };
        if (comment.created_at instanceof Date) {
            comment.created_at = comment.created_at.toISOString();
        }
        if (comment.updated_at instanceof Date) {
            comment.updated_at = comment.updated_at.toISOString();
        }
        return comment;
    }
}

module.exports = TaskComment;