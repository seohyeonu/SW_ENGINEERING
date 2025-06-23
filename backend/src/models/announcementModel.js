const pool = require('../config/database');

class Announcement {
    constructor(announcement) {
        this.announcement_id = announcement.announcement_id;
        this.title = announcement.title;
        this.content = announcement.content;
        this.created_at = announcement.created_at;
        this.updated_at = announcement.updated_at;
        this.author_id = announcement.author_id;
        this.project_id = announcement.project_id;
        this.author_name = announcement.author_name; // 조인 결과로 추가되는 필드
        this.views = announcement.views; // 조회수 필드
    }

    // 공지사항 생성
    static async create(announcementData) {
        try {
            const { title, content, author_id, project_id } = announcementData;
            
            const [result] = await pool.query(
                `INSERT INTO announcement (title, content, author_id, project_id) 
                 VALUES (?, ?, ?, ?)`,
                [title, content, author_id, project_id]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('공지사항 생성 오류:', error);
            throw error;
        }
    }

    // 프로젝트별 최신 공지사항 3개 조회 (작성자 이름 포함)
    static async getLatestByProjectId(projectId, limit = 3) {
        try {
            const [results] = await pool.query(
                `SELECT a.*, u.username as author_name 
                 FROM announcement a
                 JOIN user u ON a.author_id = u.user_id
                 WHERE a.project_id = ?
                 ORDER BY a.created_at DESC
                 LIMIT ?`,
                [projectId, limit]
            );
            
            return results.map(announcement => new Announcement(announcement));
        } catch (error) {
            console.error('프로젝트 공지사항 조회 오류:', error);
            throw error;
        }
    }

    // 프로젝트 페이지 공지사항 데이터 보내기
    static async getNoticesForProject(projectId) {
        try {
            const [results] = await pool.query(
                `SELECT 
                    a.announcement_id, 
                    a.title, 
                    a.content, 
                    u.username AS author,
                    a.created_at, 
                    a.updated_at, 
                    a.views
                 FROM announcement a
                 JOIN user u ON a.author_id = u.user_id
                 WHERE a.project_id = ?
                 ORDER BY a.created_at DESC`,
                [projectId]
            );
    
            // 결과를 프론트엔드 요구에 맞게 가공
            return results.map(row => {
                // 날짜 형식 변환 (YYYY-MM-DDThh:mm:ss.sss -> YYYY-MM-DD)
                const createdAt = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null;
                const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : null;
                
                return {
                    id: row.announcement_id,
                    title: row.title,
                    content: row.content,
                    author: row.author,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                    views: row.views
                };
            });
        } catch (error) {
            console.error('프로젝트 공지사항(notices) 조회 오류:', error);
            throw error;
        }
    }

    // 공지사항 상세 조회
    static async findById(announcementId) {
        try {
            const [results] = await pool.query(
                `SELECT a.*, u.username AS author_name 
                 FROM announcement a
                 JOIN user u ON a.author_id = u.user_id
                 WHERE a.announcement_id = ?`,
                [announcementId]
            );
            
            if (results.length === 0) {
                return null;
            }
            
            return new Announcement(results[0]);
        } catch (error) {
            console.error('공지사항 상세 조회 오류:', error);
            throw error;
        }
    }

    // 공지사항 업데이트
    static async update(announcementId, updateData) {
        try {
            const { title, content } = updateData;
            
            const [result] = await pool.query(
                `UPDATE announcement 
                 SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE announcement_id = ?`,
                [title, content, announcementId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('공지사항 업데이트 오류:', error);
            throw error;
        }
    }

    // 공지사항 삭제
    static async delete(announcementId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM announcement WHERE announcement_id = ?',
                [announcementId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('공지사항 삭제 오류:', error);
            throw error;
        }
    }

    // 공지사항 조회수 증가
    static async incrementViews(announcementId) {
        try {
            const [result] = await pool.query(
                'UPDATE announcement SET views = views + 1 WHERE announcement_id = ?',
                [announcementId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('공지사항 조회수 증가 오류:', error);
            throw error;
        }
    }


    //5.28 작업 내용
   //프로젝트 삭제시 공지사항 삭제
   static async deleteAnnouncementsByProjectId(projectId) {
    try {
        await pool.query(
            'DELETE FROM announcement WHERE project_id = ?',
            [projectId]
        );
    } catch (error) {
        console.error('프로젝트 공지사항 삭제 오류:', error);
        throw error;
    }
   }


}

module.exports = Announcement;
