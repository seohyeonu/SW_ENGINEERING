const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// 업무 생성
router.post('/tasks', authMiddleware, async (req, res) => {
    await TaskController.createTask(req, res);
});

// 프로젝트의 업무 목록 조회
router.get('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
    await TaskController.getProjectTasks(req, res);
});

// 특정 업무 상세 조회
router.get('/tasks/:taskId', authMiddleware, async (req, res) => {
    await TaskController.getTaskById(req, res);
});

// 업무 수정
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
    await TaskController.updateTask(req, res);
});

// 업무 삭제
router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
    await TaskController.deleteTask(req, res);
});

// 현재 로그인한 사용자의 할당된 업무 목록 조회
router.get('/my/tasks', authMiddleware, async (req, res) => {
    await TaskController.getUserTasks(req, res);
});

module.exports = router;
