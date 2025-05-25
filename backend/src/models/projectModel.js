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
            
            // 생성된 프로젝트 정보 조회
            const [projects] = await pool.query(
                'SELECT * FROM project WHERE project_id = ?',
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
            const [members] = await pool.query(
                `SELECT u.user_id, u.username, u.name, u.email, u.department, u.phone, pm.role
                 FROM user u
                 JOIN project_mapping pm ON u.user_id = pm.user_id
                 WHERE pm.project_id = ?
                 ORDER BY pm.role = 'manager' DESC, u.name ASC`,
                [projectId]
            );
            
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




    /*

    // 프로젝트 업데이트 -> 나중에 자세히 수정하는 걸로
    static async update(projectId, updateData) {
        try {
            const allowedFields = ['project_name', 'description', 'start_date', 'end_date', 'manager_id'];
            const updates = [];
            const values = [];
            
            // 업데이트할 필드 구성
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (updates.length === 0) {
                return await Project.findById(projectId);
            }
            
            values.push(projectId);
            
            // 프로젝트 정보 업데이트
            await pool.query(
                `UPDATE project SET ${updates.join(', ')} WHERE project_id = ?`,
                values
            );
            
            // 매니저 변경 시 프로젝트 매핑 테이블도 업데이트
            if (updateData.manager_id) {
                // 기존 매니저 권한 확인
                const [existingManagers] = await pool.query(
                    'SELECT * FROM project_mapping WHERE project_id = ? AND role = ?',
                    [projectId, 'manager']
                );
                
                // 새 매니저가 이미 프로젝트에 속해 있는지 확인
                const [newManagerMapping] = await pool.query(
                    'SELECT * FROM project_mapping WHERE project_id = ? AND user_id = ?',
                    [projectId, updateData.manager_id]
                );
                
                if (newManagerMapping.length > 0) {
                    // 이미 프로젝트에 속해 있으면 역할만 업데이트
                    await pool.query(
                        'UPDATE project_mapping SET role = ? WHERE project_id = ? AND user_id = ?',
                        ['manager', projectId, updateData.manager_id]
                    );
                } else {
                    // 프로젝트에 속해 있지 않으면 새로 추가
                    await pool.query(
                        'INSERT INTO project_mapping (project_id, user_id, role) VALUES (?, ?, ?)',
                        [projectId, updateData.manager_id, 'manager']
                    );
                }
                
                // 기존 매니저가 있고 새 매니저와 다르면 역할 변경
                if (existingManagers.length > 0 && existingManagers[0].user_id !== updateData.manager_id) {
                    await pool.query(
                        'UPDATE project_mapping SET role = ? WHERE project_id = ? AND user_id = ?',
                        ['member', projectId, existingManagers[0].user_id]
                    );
                }
            }
            
            return await Project.findById(projectId);
        } catch (error) {
            console.error('프로젝트 업데이트 오류:', error);
            throw error;
        }
    }

    // 프로젝트 삭제 -> 나중에 자세히 수정
    static async delete(projectId) {
        try {
            // 프로젝트 매핑 삭제 (CASCADE 설정이 있으면 필요 없음)
            await pool.query(
                'DELETE FROM project_mapping WHERE project_id = ?',
                [projectId]
            );
            
            // 프로젝트 삭제
            const [result] = await pool.query(
                'DELETE FROM project WHERE project_id = ?',
                [projectId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('프로젝트 삭제 오류:', error);
            throw error;
        }
    }



    // 프로젝트에 사용자 초대 -> 나중에 자세히 수정
    static async addUser(projectId, userId, role = 'member') {
        try {
            // 이미 프로젝트에 속해 있는지 확인
            const [existingMapping] = await pool.query(
                'SELECT * FROM project_mapping WHERE project_id = ? AND user_id = ?',
                [projectId, userId]
            );
            
            if (existingMapping.length > 0) {
                // 이미 존재하면 역할만 업데이트
                await pool.query(
                    'UPDATE project_mapping SET role = ? WHERE project_id = ? AND user_id = ?',
                    [role, projectId, userId]
                );
            } else {
                // 새로 추가
                await pool.query(
                    'INSERT INTO project_mapping (project_id, user_id, role) VALUES (?, ?, ?)',
                    [projectId, userId, role]
                );
            }
            
            return true;
        } catch (error) {
            console.error('프로젝트 사용자 추가 오류:', error);
            throw error;
        }
    }

    // 프로젝트에서 사용자 제거 -> 나중에 자세히 수정
    static async removeUser(projectId, userId) {
        try {
            // 프로젝트 매니저인지 확인
            const [project] = await pool.query(
                'SELECT manager_id FROM project WHERE project_id = ?',
                [projectId]
            );
            
            if (project.length > 0 && project[0].manager_id === userId) {
                throw new Error('프로젝트 매니저는 제거할 수 없습니다.');
            }
            
            // 사용자 제거
            const [result] = await pool.query(
                'DELETE FROM project_mapping WHERE project_id = ? AND user_id = ?',
                [projectId, userId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('프로젝트 사용자 제거 오류:', error);
            throw error;
        }
    }



    */

}

module.exports = Project;
