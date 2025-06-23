const pool = require('../config/database');

const Log = {
    // 생성(삽입)   
    async create({ project_id, user_id, content }) {
        const [result] = await pool.query(
        'INSERT INTO project_logs (project_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
        [project_id, user_id, content]
        );
        return result;
    },

    // 조회
    async findByUser(user_id) {
    const [rows] = await pool.query(`
      SELECT 
        pl.log_id,
        pl.project_id,
        pl.content,
        pl.created_at,
        u.username,
        pm.fields AS department,
        p.project_name
      FROM project_logs pl
      JOIN user u ON pl.user_id = u.user_id
      JOIN project p ON pl.project_id = p.project_id
      LEFT JOIN project_mapping pm 
        ON pl.project_id = pm.project_id AND pl.user_id = pm.user_id
      WHERE pl.project_id IN (
        SELECT project_id FROM project_mapping WHERE user_id = ?
      )
      ORDER BY pl.created_at DESC
    `, [user_id]);

    return [rows];
  },


  //로그 삭제
  async deleteByProjectId(projectId) {
    try {
      await pool.query('DELETE FROM project_logs WHERE project_id = ?', [projectId]);
    } catch (error) {
      console.error('Error in Log.deleteByProjectId:', error);
      throw error;
    }
  },

  // 로그 하나 삭제
  async deleteById(log_id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM project_logs WHERE log_id = ?',
        [log_id]
      );
      return result;
    } catch (error) {
      console.error('Error in Log.deleteById:', error);
      throw error;
    }
  }
};

module.exports = Log;