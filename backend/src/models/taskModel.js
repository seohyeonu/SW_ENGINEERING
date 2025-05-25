const pool = require('../config/database');

class Task {
    constructor(task) {
        this.task_id = task.task_id;
        this.project_id = task.project_id;
        this.title = task.title;
        this.content = task.content;
        this.status = task.status || 'not_started';
        this.priority = task.priority || 'low';
        this.dueDate = task.dueDate;
        this.views = task.views || 0;
        this.created_at = task.created_at;
        this.updated_at = task.updated_at;
        this.assignees = task.assignees || [];
    }

    // 새로운 업무 생성
    static async create(taskData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. 업무 생성
            const [result] = await connection.query(
                'INSERT INTO task (project_id, title, content, status, priority, dueDate) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    taskData.project_id,
                    taskData.title,
                    taskData.content,
                    taskData.status || 'not_started',
                    taskData.priority || 'low',
                    taskData.dueDate
                ]
            );

            const taskId = result.insertId;

            // 2. 담당자 할당
            if (taskData.assignees && taskData.assignees.length > 0) {
                const assigneeValues = taskData.assignees.map(assignee => 
                    [taskId, assignee.assignee_id, assignee.assigned_by]
                );

                await connection.query(
                    'INSERT INTO task_assignees (task_id, assignee_id, assigned_by) VALUES ?',
                    [assigneeValues]
                );
            }

            await connection.commit();

            // 생성된 업무 정보 조회
            return await Task.findById(taskId);

        } catch (error) {
            await connection.rollback();
            console.error('업무 생성 오류:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // 특정 업무 조회
    static async findById(taskId) {
        try {
            // 업무 정보와 담당자 정보를 함께 조회
            const [results] = await pool.query(
                `SELECT t.*, 
                        GROUP_CONCAT(DISTINCT u.name) as assignee_names,
                        GROUP_CONCAT(DISTINCT u.user_id) as assignee_ids,
                        GROUP_CONCAT(DISTINCT u.department) as assignee_departments
                 FROM task t
                 LEFT JOIN task_assignees ta ON t.task_id = ta.task_id
                 LEFT JOIN user u ON ta.assignee_id = u.user_id
                 WHERE t.task_id = ?
                 GROUP BY t.task_id`,
                [taskId]
            );

            if (results.length === 0) {
                return null;
            }

            const task = new Task(results[0]);
            
            // 담당자 정보 처리
            if (results[0].assignee_names) {
                const names = results[0].assignee_names.split(',');
                const ids = results[0].assignee_ids.split(',');
                const departments = results[0].assignee_departments.split(',');
                
                task.assignees = names.map((name, index) => ({
                    name,
                    user_id: ids[index],
                    department: departments[index]
                }));
            }

            return task;
        } catch (error) {
            console.error('업무 조회 오류:', error);
            throw error;
        }
    }

    // 프로젝트의 모든 업무 조회
    static async findByProjectId(projectId) {
        try {
            const [results] = await pool.query(
                `SELECT t.*, 
                        GROUP_CONCAT(DISTINCT u.name) as assignee_names,
                        GROUP_CONCAT(DISTINCT u.user_id) as assignee_ids,
                        GROUP_CONCAT(DISTINCT u.department) as assignee_departments
                 FROM task t
                 LEFT JOIN task_assignees ta ON t.task_id = ta.task_id
                 LEFT JOIN user u ON ta.assignee_id = u.user_id
                 WHERE t.project_id = ?
                 GROUP BY t.task_id
                 ORDER BY t.created_at DESC`,
                [projectId]
            );

            return results.map(result => {
                const task = new Task(result);
                if (result.assignee_names) {
                    const names = result.assignee_names.split(',');
                    const ids = result.assignee_ids.split(',');
                    const departments = result.assignee_departments.split(',');
                    
                    task.assignees = names.map((name, index) => ({
                        name,
                        user_id: ids[index],
                        department: departments[index]
                    }));
                }
                return task;
            });
        } catch (error) {
            console.error('프로젝트 업무 목록 조회 오류:', error);
            throw error;
        }
    }

    // 업무 수정
    static async update(taskId, updateData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. 업무 정보 업데이트
            await connection.query(
                `UPDATE task 
                 SET title = ?, content = ?, status = ?, priority = ?, dueDate = ?, updated_at = NOW()
                 WHERE task_id = ?`,
                [
                    updateData.title,
                    updateData.content,
                    updateData.status,
                    updateData.priority,
                    updateData.dueDate,
                    taskId
                ]
            );

            // 2. 담당자 정보 업데이트
            if (updateData.assignees) {
                // 기존 담당자 삭제
                await connection.query('DELETE FROM task_assignees WHERE task_id = ?', [taskId]);

                // 새로운 담당자 추가
                if (updateData.assignees.length > 0) {
                    const assigneeValues = updateData.assignees.map(assignee => 
                        [taskId, assignee.assignee_id, assignee.assigned_by]
                    );

                    await connection.query(
                        'INSERT INTO task_assignees (task_id, assignee_id, assigned_by) VALUES ?',
                        [assigneeValues]
                    );
                }
            }

            await connection.commit();

            // 수정된 업무 정보 조회
            return await Task.findById(taskId);

        } catch (error) {
            await connection.rollback();
            console.error('업무 수정 오류:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // 업무 삭제
    static async delete(taskId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. 담당자 매핑 삭제
            await connection.query('DELETE FROM task_assignees WHERE task_id = ?', [taskId]);
            
            // 2. 업무 삭제
            await connection.query('DELETE FROM task WHERE task_id = ?', [taskId]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('업무 삭제 오류:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // 사용자에게 할당된 업무 조회
    static async findByAssigneeId(userId) {
        try {
            const [results] = await pool.query(
                `SELECT t.*, 
                        GROUP_CONCAT(DISTINCT u.name) as assignee_names,
                        GROUP_CONCAT(DISTINCT u.user_id) as assignee_ids,
                        GROUP_CONCAT(DISTINCT u.department) as assignee_departments
                 FROM task t
                 INNER JOIN task_assignees ta ON t.task_id = ta.task_id
                 LEFT JOIN user u ON ta.assignee_id = u.user_id
                 WHERE ta.assignee_id = ?
                 GROUP BY t.task_id
                 ORDER BY t.created_at DESC`,
                [userId]
            );

            return results.map(result => {
                const task = new Task(result);
                if (result.assignee_names) {
                    const names = result.assignee_names.split(',');
                    const ids = result.assignee_ids.split(',');
                    const departments = result.assignee_departments.split(',');
                    
                    task.assignees = names.map((name, index) => ({
                        name,
                        user_id: ids[index],
                        department: departments[index]
                    }));
                }
                return task;
            });
        } catch (error) {
            console.error('사용자 할당 업무 조회 오류:', error);
            throw error;
        }
    }

    // 조회수 증가
    static async incrementViews(taskId) {
        try {
            await pool.query(
                'UPDATE task SET views = views + 1 WHERE task_id = ?',
                [taskId]
            );
            return true;
        } catch (error) {
            console.error('업무 조회수 증가 오류:', error);
            throw error;
        }
    }
}

module.exports = Task;
