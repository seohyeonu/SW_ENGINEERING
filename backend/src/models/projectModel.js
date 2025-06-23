const pool = require('../config/database');

class Project {
    constructor(project) {
        this.project_id = project.project_id;
        this.manager_id = project.manager_id;
        this.project_name = project.project_name;
        this.description = project.description;
        this.start_date = project.start_date;
        this.end_date = project.end_date;
        this.created_at = project.created_at;
        this.updated_at = project.updated_at;
        this.manager_name = project.manager_name;
    }

    // 프로젝트 생성
    static async create(projectData) {
        try {
            const [result] = await pool.query(
                'INSERT INTO project (manager_id, project_name, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
                [
                    projectData.manager_id,
                    projectData.project_name,
                    projectData.description || null,
                    projectData.start_date || null,
                    projectData.end_date || null
                ]
            );
            
            //auto_increment된 project_id를 가져옴(mysql 설계 상 auto_increment값은 insertId로 접근)
            const projectId = result.insertId;
            
            // 프로젝트 생성자를 프로젝트-사용자 매핑 테이블에 추가 (manager 권한)
            await pool.query(
                'INSERT INTO project_mapping (project_id, user_id, role) VALUES (?, ?, ?)',
                [projectId, projectData.manager_id, 'manager']
            );
            
            // 생성된 프로젝트 정보와 매니저 이름 함께 조회
            const [projects] = await pool.query(
                `SELECT p.*, u.name as manager_name 
                 FROM project p
                 JOIN user u ON p.manager_id = u.user_id
                 WHERE p.project_id = ?`,
                [projectId]
            );
            
            return projects[0] ? new Project(projects[0]) : null;
        } catch (error) {
            console.error('프로젝트 생성 오류:', error);
            throw error;
        }
    }

    // 프로젝트 ID로 조회
    static async findById(projectId) {
        try {
            const [projects] = await pool.query(
                'SELECT * FROM project WHERE project_id = ?',
                [projectId]
            );
            
            return projects[0] ? new Project(projects[0]) : null;
        } catch (error) {
            console.error('프로젝트 조회 오류:', error);
            throw error;
        }
    }

    // 프로젝트 ID로 프로젝트 정보와 매니저 이름 함께 조회
    static async findByIdWithManagerName(projectId) {
        try {
            const [results] = await pool.query(
                `SELECT p.*, u.name as manager_name 
                 FROM project p
                 JOIN user u ON p.manager_id = u.user_id
                 WHERE p.project_id = ?`,
                [projectId]
            );
            
            if (results.length === 0) {
                return null;
            }
            
            const project = new Project(results[0]);
            project.manager_name = results[0].manager_name;
            
            return project;
        } catch (error) {
            console.error('프로젝트와 매니저 정보 조회 오류:', error);
            throw error;
        }
    }

    // 사용자 ID로 프로젝트 목록 조회
    static async findByUserId(userId) {
        try {
            const [projects] = await pool.query(
                `SELECT p.*, u.name as manager_name 
                 FROM project p
                 JOIN project_mapping pm ON p.project_id = pm.project_id
                 JOIN user u ON p.manager_id = u.user_id
                 WHERE pm.user_id = ?
                 ORDER BY p.created_at DESC`,
                [userId]
            );
            
            return projects.map(project => {
                const newProject = new Project(project);
                newProject.manager_name = project.manager_name;
                return newProject;
            });
        } catch (error) {
            console.error('사용자 프로젝트 목록 조회 오류:', error);
            throw error;
        }
    }


    // 프로젝트 멤버 목록 조회
    static async getMembers(projectId) {
        try {
            console.log('Project.getMembers - 호출됨:', {
                projectId: projectId,
                paramType: typeof projectId
            });

            const [members] = await pool.query(
                `SELECT u.user_id, u.username, u.name, u.email, u.department, u.phone, pm.role
                 FROM user u
                 JOIN project_mapping pm ON u.user_id = pm.user_id
                 WHERE pm.project_id = ?
                 ORDER BY pm.role = 'manager' DESC, u.name ASC`,
                [projectId]
            );
            
            console.log('Project.getMembers - 조회 결과:', {
                projectId: projectId,
                memberCount: members.length,
                members: members
            });
            
            return members;
        } catch (error) {
            console.error('프로젝트 멤버 목록 조회 오류:', error);
            throw error;
        }
    }

    // 모든 프로젝트 목록 조회
    static async findAll() {
        try {
            const [projects] = await pool.query(
                'SELECT * FROM project ORDER BY created_at DESC'
            );
            
            return projects.map(project => new Project(project));
        } catch (error) {
            console.error('프로젝트 목록 조회 오류:', error);
            throw error;
        }
    }



    // 프로젝트 설명(개요) 수정
    static async updateDescription(projectId, description) {
        try {
            const [result] = await pool.query(
            'UPDATE project SET description = ?, updated_at = NOW() WHERE project_id = ?',
            [description, projectId]
        );
        // 업데이트 후 수정된 프로젝트 반환
        return await Project.findById(projectId);
         } catch (error) {
            console.error('프로젝트 설명 수정 오류:', error);
            throw error;
        }
    }


    //5.28 작업 내용
    //프로젝트 삭제 메서드
    static async deleteProject(projectId) {
        try {
            await pool.query('DELETE FROM project WHERE project_id = ?', [projectId]);
        } catch (error) {
            console.error('프로젝트 삭제 오류:', error);
            throw error;
        }
    }


    //5.28 작업 내용
    //프로젝트 삭제 시 프로젝트 매핑 테이블 내역 삭제
    static async deleteProjectMapping(projectId) {
        try {
            await pool.query('DELETE FROM project_mapping WHERE project_id = ?', [projectId]);
        } catch (error) {
            console.error('프로젝트 매핑 삭제 오류:', error);
            throw error;
        }
    }


    //프로젝트의 매니저 맞는지 확인 하는 쿼리
    static async isManager(projectId, userId) {
        
        try {
            const [result] = await pool.query('SELECT * FROM project WHERE project_id = ? AND manager_id = ?', [projectId, userId]);
            return result.length > 0;
        } catch (error) {
            console.error('프로젝트 매니저 확인 오류:', error);
            throw error;
        }
    }


    //프로젝트 팀원 초대
    static async inviteMemberByEmail(projectId, email, fields) {
        const connection = await pool.getConnection();

        try {
             await connection.beginTransaction();

        // 1. 이메일로 user_id 조회
        const [userRows] = await connection.query(
            'SELECT user_id FROM user WHERE email = ?',
            [email]
        );

        if (userRows.length === 0) {
            throw new Error('해당 이메일을 가진 사용자가 존재하지 않습니다.');
        }

        const userId = userRows[0].user_id;

        // 2. 이미 초대되었는지 확인
        const [existingRows] = await connection.query(
            'SELECT * FROM project_mapping WHERE project_id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (existingRows.length > 0) {
            throw new Error('이미 이 프로젝트에 초대된 사용자입니다.');
        }

        // 3. 초대 정보 추가
        await connection.query(
            'INSERT INTO project_mapping (project_id, user_id, role, fields) VALUES (?, ?, ?, ?)',
            [projectId, userId, 'member', fields]
        );

        await connection.commit();
        return { success: true, userId };

        } catch (error) {
            await connection.rollback();
            console.error('팀원 초대 중 오류 발생:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

  
    //팀원 목록창에서 이용할 팀원목록 조회 함수
    static async getProjectMemerListAtTeam(projectId) {
        const connection = await pool.getConnection();
        try {
            console.log('[ProjectModel] getProjectMemerListAtTeam 호출됨 - projectId:', projectId);
            
            const query = `
                SELECT 
                    u.user_id as id,
                    u.name,
                    u.status,
                    pm.fields,
                    pm.role
                FROM project_mapping pm
                JOIN user u ON pm.user_id = u.user_id
                WHERE pm.project_id = ?
                ORDER BY pm.role = 'manager' DESC, u.name ASC
            `;
            
            console.log('[ProjectModel] 실행할 쿼리:', query);
            console.log('[ProjectModel] 쿼리 파라미터:', [projectId]);
            
            const [rows] = await connection.query(query, [projectId]);
            
            console.log('[ProjectModel] 쿼리 결과:', rows);
            
            return rows;
        } catch (error) {
            console.error('[ProjectModel] 프로젝트 멤버 조회 중 오류:', error);
            throw error;
        } finally {
            connection.release();
        }   
    }  

    // 프로젝트 멤버 삭제
    static async deleteProjectMembers(projectId, memberIds) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 매니저는 삭제할 수 없도록 체크
            const [managers] = await connection.query(
                'SELECT user_id FROM project_mapping WHERE project_id = ? AND role = ? AND user_id IN (?)',
                [projectId, 'manager', memberIds]
            );

            if (managers.length > 0) {
                throw new Error('프로젝트 매니저는 삭제할 수 없습니다.');
            }

            // 선택된 멤버들 삭제
            await connection.query(
                'DELETE FROM project_mapping WHERE project_id = ? AND user_id IN (?) AND role != ?',
                [projectId, memberIds, 'manager']
            );

            await connection.commit();
            
            // 삭제된 행 수 반환
            const [result] = await connection.query(
                'SELECT ROW_COUNT() as deletedCount'
            );
            return result[0].deletedCount;

        } catch (error) {
            await connection.rollback();
            console.error('프로젝트 멤버 삭제 중 오류:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
}

module.exports = Project;