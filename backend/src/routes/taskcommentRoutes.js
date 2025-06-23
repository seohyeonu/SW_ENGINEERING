const express = require('express');
const router = express.Router();
const TaskCommentController = require('../controllers/taskcommentController');
const authMiddleware = require('../middleware/authMiddleware');

// 댓글 생성
router.post('/', authMiddleware, async (req, res) => {
    await TaskCommentController.createComment(req, res);
});

// 댓글 조회    
router.get('/:task_id', authMiddleware, async (req, res) => {
    await TaskCommentController.getComments(req, res);
});

module.exports = router;