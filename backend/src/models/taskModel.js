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

            console.log('TaskModel - create 시작:', taskData);

            const { title, content, project_id, status = 'not_started', priority, dueDate, assignees } = taskData;
            
            // priority 값 변환
            let normalizedPriority = 'LOW';
            if (priority) {
                switch(priority.toLowerCase()) {
                    case 'high': normalizedPriority = 'HIGH'; break;
                    case 'middle':
                    case 'medium': normalizedPriority = 'MEDIUM'; break;
                    case 'low': normalizedPriority = 'LOW'; break;
                }
            }

            // 1. task 테이블에 업무 생성
            const [taskResult] = await connection.query(
                `INSERT INTO task (project_id, title, content, status, priority, dueDate) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [project_id, title, content, status.toUpperCase(), normalizedPriority, dueDate]
            );
            
            const taskId = taskResult.insertId;
            console.log('TaskModel - 업무 생성됨, taskId:', taskId);

            // 2. task_assignees 테이블에 할당 정보 추가
            if (Array.isArray(assignees) && assignees.length > 0) {
                console.log('TaskModel - 담당자 할당 시작:', assignees);

                const assigneeValues = assignees.map(assignee => [
                    taskId,
                    assignee.assignee_id,
                    assignee.assigned_by
                ]);
                
                await connection.query(
                    `INSERT INTO task_assignees (task_id, assignee_id, assigned_by) VALUES ?`,
                    [assigneeValues]
                );

                console.log('TaskModel - 담당자 할당 완료');
            }

            await connection.commit();
            console.log('TaskModel - 트랜잭션 커밋 완료');

            // 3. 생성된 업무 정보 조회 및 반환
            const createdTask = await this.findById(taskId);
            console.log('TaskModel - 생성된 업무:', createdTask);
            
            return createdTask;

        } catch (error) {
            await connection.rollback();
            console.error('TaskModel - 업무 생성 중 오류:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // 특정 업무 조회
    static async findById(taskId) {
        try {
            // 1. 업무 기본 정보 조회
            const [tasks] = await pool.query(
                `SELECT * FROM task WHERE task_id = ?`,
                [taskId]
            );

            if (tasks.length === 0) return null;

            const task = tasks[0];

            // 2. 업무 담당자 정보 조회
            const [assignees] = await pool.query(
                `SELECT 
                    u.user_id,
                    u.name,
                    pm.fields as team
                FROM task_assignees ta
                JOIN user u ON ta.assignee_id = u.user_id
                JOIN project_mapping pm ON u.user_id = pm.user_id
                WHERE ta.task_id = ?`,
                [taskId]
            );

            return {
                ...task,
                assignees
            };
        } catch (error) {
            console.error('업무 조회 중 오류:', error);
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
                        GROUP_CONCAT(DISTINCT u.department) as assignee_departments,
                        DATE_FORMAT(t.dueDate, '%Y-%m-%d') as formatted_dueDate
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
                        user_id: parseInt(ids[index]),
                        department: departments[index]
                    }));
                }

                // MySQL에서 포맷된 날짜 사용
                if (result.formatted_dueDate) {
                    task.dueDate = result.formatted_dueDate;
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
        if (!updateData) {
            throw new Error('업데이트할 데이터가 없습니다.');
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { assignees, assigned_by, ...taskData } = updateData;

            // 1. 업무 정보 업데이트
            if (Object.keys(taskData).length > 0) {
                const setClauses = Object.entries(taskData)
                    .map(([key, _]) => `${key} = ?`)
                    .join(', ');

                if (setClauses) {
                    await connection.query(
                        `UPDATE task SET ${setClauses} WHERE task_id = ?`,
                        [...Object.values(taskData), taskId]
                    );
                }
            }

            // 2. 담당자 업데이트
            if (assignees) {
                // 기존 삭제
                await connection.query(
                    'DELETE FROM task_assignees WHERE task_id = ?', 
                    [taskId]
                );

                // 새로 삽입
                if (assignees.length > 0) {
                    const assigneeValues = assignees.map(assignee => [
                        taskId,
                        assignee.assignee_id,
                        assignee.assigned_by || assigned_by  // 예외 처리까지
                    ]);

                    await connection.query(
                        'INSERT INTO task_assignees (task_id, assignee_id, assigned_by) VALUES ?',
                        [assigneeValues]
                    );
                }
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 업무 삭제 (task_comments → task_assignees → task 순서로 삭제) 수정 함.(2025.05.30)
    static async delete(taskId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction(); // 트랜잭션 시작

            // 1. task_comments 테이블에서 댓글 삭제 (task만 먼저 삭제하려고 함	❌ 외래키 제약으로 막힘 그래서 해당 업무의 댓글을 밀어 버림.)
            await connection.query(
                'DELETE FROM task_comments WHERE task_id = ?',
                [taskId]
            );

            // 2. task_assignees 테이블에서 관련 데이터 삭제
            await connection.query(
                'DELETE FROM task_assignees WHERE task_id = ?',
                [taskId]
            );

            // 3. task 테이블에서 해당 업무 삭제
            const [result] = await connection.query(
                'DELETE FROM task WHERE task_id = ?',
                [taskId]
            );

            await connection.commit(); // 트랜잭션 커밋
            return result.affectedRows > 0;

        } catch (error) {
            await connection.rollback(); // 오류 발생 시 롤백
            console.error('업무 삭제 중 오류 발생:', error);
            throw error;
        } finally {
            connection.release(); // 커넥션 반환
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

    // 특정 업무의 할당 정보 조회
    static async getTaskAssignees(taskId) {
        try {
            const [assignees] = await pool.query(
                `SELECT 
                    ta.task_assignees_id,
                    ta.assignee_id,
                    u.name as assignee_name,
                    ta.assigned_at,
                    ta.assigned_by
                FROM task_assignees ta
                JOIN user u ON ta.assignee_id = u.user_id
                WHERE ta.task_id = ?`,
                [taskId]
            );
            return assignees;
        } catch (error) {
            console.error('업무 할당 정보 조회 중 오류 발생:', error);
            throw error;
        }
    }

    // 업무가 존재하는지 확인
    static async exists(taskId) {
        try {
            const [rows] = await pool.query(
                'SELECT 1 FROM task WHERE task_id = ? LIMIT 1',
                [taskId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('업무 존재 여부 확인 중 오류 발생:', error);
            throw error;
        }
    }

    // TaskModel에 추가할 메소드
    static async isProjectMember(taskId, userId) {
        try {
            const [result] = await pool.query(
                `SELECT 1
                FROM task t
                JOIN project p ON t.project_id = p.project_id
                JOIN project_mapping pm ON p.project_id = pm.project_id
                WHERE t.task_id = ? 
                AND (pm.user_id = ? OR p.manager_id = ?)
                LIMIT 1`,
                [taskId, userId, userId]
            );
            return result.length > 0;
        } catch (error) {
            console.error('프로젝트 멤버 확인 중 오류 발생:', error);
            throw error;
        }
    }

    static async updateStatus(taskId, newStatus) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 상태 업데이트
            await connection.query(
                'UPDATE task SET status = ? WHERE task_id = ?',
                [newStatus.toUpperCase(), taskId]
            );

            await connection.commit();
            
            // 업데이트된 task 반환
            const [tasks] = await connection.query(
                'SELECT * FROM task WHERE task_id = ?',
                [taskId]
            );
            
            return tasks[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }


    //5.28 작업 내용
    //프로젝트 삭제 시  업무 삭제
    static async deleteByProjectId(projectId) {
        try {
            await pool.query('DELETE FROM task WHERE project_id = ?', [projectId]);
        } catch (error) {
            console.error('Error in Task.deleteByProjectId:', error);
            throw error;    
        }
    }

    //5.28 작업 내용
    //프로젝트 삭제 시 업무 매핑 테이블 내역 삭제
    static async deletetaskassigneesByProjectId(projectId) {
        try {
            await pool.query('DELETE FROM task_assignees WHERE task_id IN (SELECT task_id FROM task WHERE project_id = ?)', [projectId]);
        } catch (error) {
            console.error('Error in Task.deletetaskassigneesByProjectId:', error);
            throw error;
        }
    }

    //5.29 작업 내용
    // 사용자 아이디를 파라미터로 넘겨 받고, 해당 사용자에게 할당된 모든 업무를 조회
    static async findByAssigneeId(userId) {
        try{
            const [results] = await pool.query(
                `SELECT t.task_id , t.title, t.priority
                from task t, task_assignees ta
                where ta.assignee_id = ?
                and t.task_id = ta.task_id
                and DATE(t.dueDate) = CURDATE()
                `,
                [userId]
            );

            return results.map(result => ({
                id: result.task_id,
                text: result.title,
                priority: result.priority,
                checked: false // 프론트엔드에서 사용하는 기본값
            }));
        }
        catch(error){
            console.error('Error in Task.findByAssigneeId:', error);
            throw error;
        }
    }

}

module.exports = Task;
