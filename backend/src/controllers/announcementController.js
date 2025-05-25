const Announcement = require('../models/announcementModel');

class AnnouncementController {
    // 공지사항 생성
    async createAnnouncement(req, res) {
        try {
            const { title, content, project_id } = req.body;
            const author_id = req.user.id; // 인증 미들웨어에서 설정된 사용자 ID
            
            // 필수 필드 검증
            if (!title || !project_id) {
                return res.status(400).json({
                    success: false,
                    message: '제목과 프로젝트 ID는 필수 항목입니다.'
                });
            }
            
            // 공지사항 생성
            const announcementId = await Announcement.create({
                title,
                content,
                author_id,
                project_id
            });
            
            // 생성된 공지사항 조회
            const announcement = await Announcement.findById(announcementId);
            
            return res.status(201).json({
                success: true,
                message: '공지사항이 성공적으로 생성되었습니다.',
                announcement
            });
        } catch (error) {
            console.error('공지사항 생성 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 프로젝트별 최신 공지사항 조회
    async getProjectAnnouncements(req, res) {
        try {
            const { projectId } = req.params;
            const notices = await Announcement.getNoticesForProject(projectId);
            
            // 날짜 형식 변환 (YYYY-MM-DDThh:mm:ss.sss -> YYYY-MM-DD)
            const formattedNotices = notices.map(notice => {
                // 원본 데이터 복사
                const formattedNotice = { ...notice };
                
                // 날짜 형식 변환
                if (formattedNotice.created_at) {
                    formattedNotice.created_at = new Date(formattedNotice.created_at).toISOString().split('T')[0];
                }
                
                if (formattedNotice.updated_at) {
                    formattedNotice.updated_at = new Date(formattedNotice.updated_at).toISOString().split('T')[0];
                }
                
                return formattedNotice;
            });
            
            console.log(`[공지사항 컨트롤러] 프로젝트 ${projectId}의 공지사항 조회 완료, 개수: ${formattedNotices.length}`);
            
            return res.status(200).json({
                success: true,
                notices: formattedNotices
            });
        } catch (error) {
            console.error('프로젝트별 공지사항 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 공지사항 상세 조회
    async getAnnouncementById(req, res) {
        try {
            const { announcementId } = req.params;
            
            // 공지사항 조회
            const announcement = await Announcement.findById(announcementId);
            
            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 공지사항을 찾을 수 없습니다.'
                });
            }
            
            return res.status(200).json({
                success: true,
                announcement
            });
        } catch (error) {
            console.error('공지사항 상세 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 공지사항 업데이트
    async updateAnnouncement(req, res) {
        try {
            const { announcementId } = req.params;
            const { title, content } = req.body;
            const userId = req.user.id; // 인증 미들웨어에서 설정된 사용자 ID
            
            // 공지사항 조회
            const announcement = await Announcement.findById(announcementId);
            
            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 공지사항을 찾을 수 없습니다.'
                });
            }
            
            // 작성자 확인
            if (announcement.author_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: '공지사항을 수정할 권한이 없습니다.'
                });
            }
            
            // 공지사항 업데이트
            const success = await Announcement.update(announcementId, { title, content });
            
            if (!success) {
                return res.status(500).json({
                    success: false,
                    message: '공지사항 업데이트에 실패했습니다.'
                });
            }
            
            // 업데이트된 공지사항 조회
            const updatedAnnouncement = await Announcement.findById(announcementId);
            
            return res.status(200).json({
                success: true,
                message: '공지사항이 성공적으로 업데이트되었습니다.',
                announcement: updatedAnnouncement
            });
        } catch (error) {
            console.error('공지사항 업데이트 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 업데이트 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
    
    // 공지사항 삭제
    async deleteAnnouncement(req, res) {
        try {
            const { announcementId } = req.params;
            const userId = req.user.id; // 인증 미들웨어에서 설정된 사용자 ID
            
            // 공지사항 조회
            const announcement = await Announcement.findById(announcementId);
            
            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 공지사항을 찾을 수 없습니다.'
                });
            }
            
            // 작성자 확인
            if (announcement.author_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: '공지사항을 삭제할 권한이 없습니다.'
                });
            }
            
            // 공지사항 삭제
            const success = await Announcement.delete(announcementId);
            
            if (!success) {
                return res.status(500).json({
                    success: false,
                    message: '공지사항 삭제에 실패했습니다.'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: '공지사항이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('공지사항 삭제 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 삭제 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    async getNoticesForProject(req, res) {
       const projectId = req.params.projectId
        try {
            const notices = await Announcement.getNoticesForProject(projectId);
            res.json({success: true, notices});
        } catch (error) {
            console.error('프로젝트 공지사항 컨트롤러 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }

    }

    async getProjectAnnouncements(req, res) {
        try {
            const { projectId } = req.params;
            const notices = await Announcement.getNoticesForProject(projectId);
            return res.status(200).json({
                success: true,
                notices
            });
        } catch (error) {
            console.error('프로젝트별 공지사항 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 공지사항 조회수 증가
    async incrementAnnouncementViews(req, res) {
        try {
            const { announcementId } = req.params;
            
            // 조회수 증가
            const success = await Announcement.incrementViews(announcementId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '해당 공지사항을 찾을 수 없습니다.'
                });
            }
            
            // 업데이트된 공지사항 정보 조회
            const announcement = await Announcement.findById(announcementId);
            
            return res.status(200).json({
                success: true,
                message: '공지사항 조회수가 증가되었습니다.',
                views: announcement.views
            });
        } catch (error) {
            console.error('공지사항 조회수 증가 오류:', error);
            return res.status(500).json({
                success: false,
                message: '공지사항 조회수 증가 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

}

module.exports = new AnnouncementController();
