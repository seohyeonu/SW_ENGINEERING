const pool = require('../config/database');

const Notification = {
  async create({ user_id, title, message }) {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [user_id, title, message]
    );
    return result.insertId;
  }
};

module.exports = Notification;
