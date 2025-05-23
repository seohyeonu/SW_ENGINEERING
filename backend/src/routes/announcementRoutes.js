const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middleware/authMiddleware');


// 모든 공지사항 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 공지사항 생성
router.post('/', announcementController.createAnnouncement);

// 프로젝트별 최신 공지사항 조회
router.get('/project/:projectId', announcementController.getProjectAnnouncements);

// 공지사항 상세 조회
router.get('/:announcementId', announcementController.getAnnouncementById);

// 공지사항 업데이트
router.put('/:announcementId', announcementController.updateAnnouncement);

// 공지사항 삭제
router.delete('/:announcementId', announcementController.deleteAnnouncement);

// 프로젝트 공지사항 조회
router.get('/project/:projectId/notices', announcementController.getNoticesForProject);

// 프로젝트별 공지사항 목록
router.get('/project/:projectId', announcementController.getProjectAnnouncements.bind(announcementController));

// 공지사항 조회수 증가
router.put('/:announcementId/views', announcementController.incrementAnnouncementViews.bind(announcementController));

module.exports = router;
