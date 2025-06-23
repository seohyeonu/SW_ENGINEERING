const express = require('express');
const router = express.Router();
const AnnouncementCommentController = require('../controllers/announcementcommentController');
const authMiddleware = require('../middleware/authMiddleware');

// 댓글 생성
router.post('/', authMiddleware, async (req, res) => {
    await AnnouncementCommentController.createComment(req, res);
});

// 댓글 조회    
router.get('/:announcement_id', authMiddleware, async (req, res) => {
    await AnnouncementCommentController.getComments(req, res);
});

module.exports = router;