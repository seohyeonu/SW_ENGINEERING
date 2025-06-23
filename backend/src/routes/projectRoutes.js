const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 프로젝트 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 로그인한 유저가 속한 프로젝트들(project_mapping 기반)을 응답해주는 API
// [중요] '/mine' 먼저 정의해야 동적 라우팅과 충돌 없음
router.get('/mine', authMiddleware, projectController.getMyProjects);

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

// 프로젝트 멤버 목록 조회
router.get('/:projectId/members', projectController.getMembers);
router.get('/:projectId/members/all', projectController.getProjectMemerListAtTeam);
router.get('/:projectId/members/:team', projectController.getTeamMembers);

// 프로젝트 팀원 초대
router.post('/:projectId/invite', projectController.inviteMember);

// DELETE /api/projects/:projectId/members
router.delete('/:projectId/members', projectController.deleteMembers);



module.exports = router;
