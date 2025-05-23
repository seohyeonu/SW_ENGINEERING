const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 프로젝트 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 프로젝트 생성
router.post('/', projectController.createProject);

// 사용자별 프로젝트 목록 조회
router.get('/', projectController.getUserProjects);

// 프로젝트 상세 조회
router.get('/:projectId', projectController.getProjectById);

// 프로젝트 업데이트
router.put('/:projectId', projectController.updateProject);

// 프로젝트 삭제
router.delete('/:projectId', projectController.deleteProject);

// 프로젝트에 사용자 추가
router.post('/:projectId/users', projectController.addUserToProject);

// 프로젝트에서 사용자 제거
router.delete('/:projectId/users/:userId', projectController.removeUserFromProject);

//프로젝트 설명 수정
router.patch('/:id', projectController.updateProjectDescription);


module.exports = router;
