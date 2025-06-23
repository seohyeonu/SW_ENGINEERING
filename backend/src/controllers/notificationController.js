const db = require('../config/database');

// 사용자 알림 목록
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const [rows] = await db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json(rows);
};

// 읽음 처리
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  res.sendStatus(200);
};

// 삭제
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM notifications WHERE id = ?', [id]);
  res.sendStatus(200);
};
