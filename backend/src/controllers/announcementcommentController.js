// controllers/announcementCommentController.js
const AnnouncementComment = require('../models/announcementcommentModel');
const db = require('../config/database');

const AnnouncementCommentController = {

  // 댓글 생성
  async createComment(req, res) {
    try {
      const { announcement_id, content, created_by } = req.body;
      const io = req.app.get('io'); // socket.io 인스턴스 가져오기

      if (!announcement_id || !content || !created_by) {
        return res.status(400).json({ error: 'announcement ID, content, and created_by are required.' });
      }

      // 댓글 저장
      const comment = await AnnouncementComment.create({
        announcement_id: parseInt(announcement_id),
        content,
        created_by: parseInt(created_by)
      });

      if (!comment) {
        return res.status(500).json({ error: 'Failed to create comment. Comment object not returned.' });
      }

      // 공지 작성자 조회
      const [[announcement]] = await db.query(
        'SELECT author_id, title FROM announcement WHERE announcement_id = ?',
        [announcement_id]
      );

      // if (announcement && announcement.author_id !== parseInt(created_by)) {
      //   // 알림 저장
      //   await db.query(
      //     'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)',
      //     [announcement.author_id, '공지에 새 댓글', `공지 "${announcement.title}"에 댓글이 달렸습니다.`]
      //   );

      //   // 실시간 알림 전송
      //   io.to(`user-${announcement.author_id}`).emit('new-notification', {
      //     title: '공지에 새 댓글',
      //     message: `공지 "${announcement.title}"에 댓글이 달렸습니다.`,
      //     created_at: new Date(),
      //     is_read: 0,
      //   });
      // }
      // 알림 로직 보호된 버전
      if (announcement && announcement.author_id && announcement.author_id !== parseInt(created_by)) {
        try {
          // 알림 저장 (DB에 삽입)
          await db.query(
            'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)',
            [
              announcement.author_id,
              '공지에 새 댓글',
              `공지 "${announcement.title || '제목 없음'}"에 댓글이 달렸습니다.`
            ]
          );

          // 실시간 알림 전송
          if (req.app.get('notificationIo')) {
            req.app.get('notificationIo').to(`user-${announcement.author_id}`).emit('new-notification', {
              title: '공지에 새 댓글',
              message: `공지 "${announcement.title || '제목 없음'}"에 댓글이 달렸습니다.`,
              created_at: new Date(),
              is_read: 0,
            });
          } else {
            console.warn('notificationIo가 설정되지 않았습니다.');
          }

        } catch (alertError) {
          console.error('[알림 처리 중 오류]', alertError.message);
        }
      }


      res.status(201).json(comment);

    } catch (error) {
      console.error('Error in TaskCommentController.createComment:', error);
      res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  },

  // 댓글 조회
  async getComments(req, res) {
    try {
      const { announcement_id } = req.params;
      const comments = await AnnouncementComment.findByAnnouncementId(parseInt(announcement_id));
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error in TaskCommentController.getComments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = AnnouncementCommentController;
